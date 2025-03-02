#!/usr/bin/env python3

# Copyright (c) 2022-2024 mascal
#
# CoRT is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# CoRT is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with CoRT.  If not, see <http://www.gnu.org/licenses/>.

from datetime import datetime
import json
import sqlite3
import sys
from timeit import default_timer as timer

db_schema = """
create table if not exists events (
    date integer not null,
    name text not null,
    location text not null,
    owner text not null,
    type text not null
);
"""

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def statistics(events, db_file, force_rewrite = False):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Exception as e:
        eprint("Failed to create a database connection to", db_file, ":", e)
        sys.exit(1)

    conn.row_factory = sqlite3.Row
    sql = conn.cursor()
    try:
        sql.executescript(db_schema)
    except Exception as e:
        eprint("Failed to create db: ", e)
        sys.exit(1)

    insert_queries = []
    sql.execute("select max(date) from events limit 1;")
    latest_recorded_event = sql.fetchone()[0]
    if latest_recorded_event == None:
        latest_recorded_event = 0 # the db is empty

    for event in events:
        if event["date"] <= latest_recorded_event:
            continue
        # Remove fort numbers
        event["name"] = event["name"].rsplit(' ', 1)[0]
        insert_queries.append([event["date"], event["name"], event["location"],
                              event["owner"], event["type"]])

    if ( len(insert_queries) > 0 and not force_rewrite ) or force_rewrite:
        sql.executemany("insert into events values(?, ?, ?, ?, ?)", insert_queries)
        conn.commit()
        start_time = timer()
        now = datetime.now()
        days = [7, 30, 90]

        # Optimise queries by using only the needed subsets of the table
        report_mints = int(now.timestamp()) - (max(days) * 24 * 3600)
        sql.execute(f"""create temporary table report as
                      select * from events where date >= {report_mints} and type != "relic";""")
        sql.execute(f"""create temporary table reportforts as
                      select * from report where type = "fort";""")
        sql.execute(f"""create temporary table reportwalls as
                      select * from reportforts where name like "Great Wall of %";""")
        sql.execute(f"""create temporary table reportgems as
                      select * from report where type = "gem" and location != owner;""")

        full_report = [{"generated": int(now.timestamp())}]
        for day in days:
            seconds_ago = int(now.timestamp()) - (day * 24 * 3600)
            reporter = Reporter(conn, seconds_ago)
            full_report.append(reporter.generate_stats())
            if day == max(days):
                full_report[0]["activity"] = reporter.get_activity()
                full_report[0]["invasions"] = reporter.get_invasions()
                full_report[0]["gems"] = reporter.get_gems()
                full_report[0]["wishes"] = reporter.get_wishes()
                full_report[0]["fortsheld"] = reporter.get_fortsheld()
                for realm in ("Alsius", "Ignis", "Syrtis"):
                    # No wish the last 90 days?
                    if full_report[-1][realm]["wishes"]["last"] == None:
                        full_report[-1][realm]["wishes"]["last"] = reporter.get_last_wish_further(realm)
        end_time = timer()
        full_report[0]["generation_time"] = end_time - start_time;

        return [json.dumps(full_report), json.dumps(reporter.dump_events())]



class Reporter(object):

    def __init__(self, conn, lastxseconds):
        self.conn = conn
        self.sql = self.conn.cursor()
        self.startfrom = lastxseconds
        self.stats = {"Alsius": {}, "Ignis": {}, "Syrtis": {}}
        self.sample_days = None

    def get_oldest_event(self):
        # Ensure proper average value if we've less than self.startfrom days of data
        self.sql.execute(f"""select (unixepoch("now") - min(date)) / (24 * 3600) as days
                             from report
                             where date >= {self.startfrom};""")
        self.sample_days = self.sql.fetchone()["days"]
        if self.sample_days == 0: # Ensure 1st run is ok
            self.sample_days = 1

    def get_activity(self):
        activity = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        if self.sample_days is None:
            self.get_oldest_event()
        def query(condition, sign=""):
            return f"""select owner, strftime("%H", time(date, 'unixepoch')) as time,
                       {sign} cast(count (rowid) as float) / {self.sample_days} as average
                       from reportforts
                       where owner {condition} location
                       group by owner, time
                       order by time;"""

        # Captured then recovered forts
        for param in [ ["!=", ""], ["=", "0 -"] ]:
            self.sql.execute(query(param[0], param[1]))
            for r in self.sql.fetchall():
                if r["average"] is not None: # Ensure 1st time run is ok
                    activity[r["owner"]][int(r["time"])] += r["average"]

        return activity

    def get_invasions(self):
        invasions = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        if self.sample_days is None:
            self.get_oldest_event()
        def query(condition, sign=""):
            return f"""select owner, strftime("%H", time(date, 'unixepoch')) as time,
                       {sign} cast(count(rowid) as float) / {self.sample_days} as average
                       from reportwalls
                       where owner {condition} location
                       group by owner, time
                       order by time;"""

        # Captured then recovered forts
        for param in [ ["!=", ""], ["=", "0 -"] ]:
            self.sql.execute(query(param[0], param[1]))
            for r in self.sql.fetchall():
                if r["average"] is not None: # Ensure 1st time run is ok
                    invasions[r["owner"]][int(r["time"])] += r["average"]

        return invasions

    def get_gems(self):
        gems = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        self.sql.execute(f"""select owner, strftime("%H", time(date, 'unixepoch')) as time,
                             count(rowid) as count
                             from reportgems
                             group by owner, time;""")
        for r in self.sql.fetchall():
            gems[r["owner"]][int(r["time"])] = r["count"]

        return gems

    def get_wishes(self):
        wishes = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        self.sql.execute(f"""select location, strftime("%H", time(date, 'unixepoch')) as time,
                             count(rowid) as count
                             from report
                             where type="wish"
                             group by location, time;""")
        for r in self.sql.fetchall():
            wishes[r["location"]][int(r["time"])] = r["count"]

        return wishes

    def get_last_wish_further(self, realm):
        self.sql.execute(f"""select location, date
                             from events
                             where type="wish"
                             and location = "{realm}"
                             order by date desc limit 1""")
        r = self.sql.fetchone()
        return r["date"]

    def get_fortsheld(self):
        forts_held = {
          "Aggersborg": {}, "Trelleborg": {}, "Imperia": {},
          "Samal": {}, "Menirah": {}, "Shaanarid": {},
          "Herbred": {}, "Algaros": {}, "Eferias":{} }
        total_forts = {"Alsius": 0, "Ignis": 0, "Syrtis": 0}
        average_forts = {"Alsius":[], "Ignis":[], "Syrtis":[]}
        count_forts = {"Alsius":[], "Ignis":[], "Syrtis":[]}

        for fort in forts_held:
            for realm in total_forts: # Ensure 1st run is ok
                forts_held[fort][realm] = {"time": 0, "count": 0}
            self.sql.execute(f"""select date, owner, location
                            from reportforts
                            where name = "Fort {fort}" or name = "{fort} Castle"
                            order by date asc;""")
            events = self.sql.fetchall()
            for i in range(0, len(events) - 1):
                ev = events[i]
                nextev = events[i + 1]
                timediff = (nextev["date"] - ev["date"]) / 60
                whoheld = ev["owner"]
                forts_held[fort][whoheld]["time"] += timediff
                forts_held[fort][whoheld]["count"] += 1
                forts_held[fort][whoheld]["location"] = ev["location"]

            # Making it friendly for chartist.js in the front
            for realm in total_forts:
                # Ensure 1st time run is ok; it's shorter than prepopulating
                if forts_held[fort][realm]["count"] != 0:
                    average = int(forts_held[fort][realm]["time"] / forts_held[fort][realm]["count"])
                    forts_held[fort][realm]["average"] = average
                else:
                    forts_held[fort][realm]["average"] = 0
                average_forts[realm].append(forts_held[fort][realm]["average"])
                # Compute total and convert minutes to hours
                total_forts[realm] += int(forts_held[fort][realm]["time"] / 60)
                # Get count values (could be optimized but KISS)
                count = 0 # skip fort recoveries
                # Ensure 1st time run is ok
                if "location" in forts_held[fort][realm] and \
                        realm != forts_held[fort][realm]["location"]:
                    count = forts_held[fort][realm]["count"]
                count_forts[realm].append(count)

        return {"average": average_forts, "total": total_forts, "count": count_forts}

    def generate_stats(self):

        # Eferias set as default to ensure proper first time run
        for realm in self.stats:
            self.stats[realm] = {
                "forts": {
                    "total": 0,
                    "recovered": 0,
                    "captured": 0,
                    "most_captured": {
                        "name": "Eferias Castle",
                        "count": 0
                    }
                },
                "invasions": {
                    "invaded": {
                        "count": 0
                    },
                    "last": {
                        "location": None,
                        "date": None
                    }
                },
                "gems": {
                    "stolen": {
                        "last": None,
                        "count": 0
                    }
                },
                "wishes": {
                    "count": 0,
                    "last": None
                }
            }

        def query_fort_events(condition):
            return f"""select owner as realm, count(rowid) as count
                       from reportforts
                       where owner {condition} location
                       and date >= {self.startfrom}
                       group by owner;"""

        # Get captured and recovered forts
        for param in [ ["captured", "!="], ["recovered", "="] ]:
            self.sql.execute(query_fort_events(param[1]))
            for r in self.sql.fetchall():
                self.stats[r["realm"]]["forts"][param[0]] = r["count"]

        # Deduce total forts captures
        for realm in self.stats:
            self.stats[realm]["forts"]["total"] = \
                self.stats[realm]["forts"]["captured"] + self.stats[realm]["forts"]["recovered"]

        # Get most captured forts by realm
        self.sql.execute(f"""select  owner as realm, name, count(name) as count
                             from reportforts
                             where owner != location
                             and date >= {self.startfrom}
                             group by owner, name
                             order by count asc;""")
        for r in self.sql.fetchall():
            if "most_captured" in self.stats[r["realm"]]:
                continue
            self.stats[r["realm"]]["forts"]["most_captured"]["name"] = r["name"]
            self.stats[r["realm"]]["forts"]["most_captured"]["count"] = r["count"]

        # Get count of invasions and last invasion by realm
        self.sql.execute(f"""select owner as realm, location, max(date) as date, count(name) as count
                             from reportwalls
                             where owner != location
                             and date >= {self.startfrom}
                             group by owner;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["invasions"]["last"]["location"] = r["location"]
            self.stats[r["realm"]]["invasions"]["last"]["date"] = r["date"]
            self.stats[r["realm"]]["invasions"]["count"] = r["count"]

        # Get the number of times a realm got invaded
        self.sql.execute(f"""select owner as realm, count(name) as count
                             from reportwalls
                             where owner = location
                             and date >= {self.startfrom}
                             group by location;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["invasions"]["invaded"]["count"] = r["count"]

        # Get last gem stolen date and total count
        self.sql.execute(f"""select owner as realm, max(date) as date, count(date) as count
                             from reportgems
                             where date >= {self.startfrom}
                             group by owner;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["gems"]["stolen"]["last"] = r["date"]
            self.stats[r["realm"]]["gems"]["stolen"]["count"] = r["count"]

        # Get last dragon wish and wishes count
        self.sql.execute(f"""select location as realm, count(rowid) as count,
                             max(date) as date
                             from report
                             where type = "wish"
                             and date >= {self.startfrom}
                             group by location;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["wishes"]["last"] = r["date"]
            self.stats[r["realm"]]["wishes"]["count"] = r["count"]

        return self.stats

    def dump_events(self):
        # Whatever the maximum number of days chosen for the stats,
        # use 3 days max for the events
        self.sql.execute(f"""select *
                             from report
                             where date > unixepoch() - 3 * 24 * 3600
                             order by date desc""")
        output = [{"generated": int(datetime.now().timestamp())}]
        for r in self.sql.fetchall():
            output.append(dict(r))
        return output
