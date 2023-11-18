#!/usr/bin/env python3

# Copyright (c) 2023 mascal
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


def statistics(events, db_file):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Exception as e:
        print("Failed to create a database connection to", db_file, ":", e)
        sys.exit(1)

    conn.row_factory = sqlite3.Row
    sql = conn.cursor()
    try:
        sql.executescript(db_schema)
    except Exception as e:
        print("Failed to create db: ", e)
        sys.exit(1)

    insert_queries = []
    sql.execute("select max(date) from events limit 1;")
    latest_recorded_event = sql.fetchone()[0]
    if latest_recorded_event == None:
        latest_recorded_event = 0 # the db is empty

    for event in events:
        # We can't do much with relics atm
        if event["date"] <= latest_recorded_event or event["type"] == "relic":
            continue
        # Remove fort numbers
        event["name"] = event["name"].rsplit(' ', 1)[0]
        insert_queries.append([event["date"], event["name"], event["location"],
                              event["owner"], event["type"]])

    if len(insert_queries) > 0:
        sql.executemany("insert into events values(?, ?, ?, ?, ?)", insert_queries)
        conn.commit()
        start_time = timer()
        now = datetime.now()
        days = [7, 30, 90]

        # Optimise queries by using only the needed subset of the table
        report_mints = int(now.timestamp()) - (max(days) * 24 * 3600)
        sql.execute(f"""create temporary table report as
                      select * from events where date >= {report_mints};""")

        full_report = [{"generated": int(now.timestamp())}]
        for day in days:
            seconds_ago = int(now.timestamp()) - (day * 24 * 3600)
            reporter = Reporter(conn, seconds_ago)
            full_report.append(reporter.generate_stats())
            if day == max(days):
                full_report[0]["activity"] = reporter.get_activity()
                full_report[0]["invasions"] = reporter.get_invasions()
                full_report[0]["gems"] = reporter.get_gems()
        end_time = timer()
        full_report[0]["generation_time"] = end_time - start_time;

        return [json.dumps(full_report), json.dumps(reporter.dump_events())]



class Reporter:

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

    def get_activity(self):
        activity = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        if self.sample_days is None:
            self.get_oldest_event()
        def query(condition, sign=""):
            return f"""select owner, strftime("%H", time(date, 'unixepoch')) as time,
                       {sign} cast(count (rowid) as float) / {self.sample_days} as average
                       from report
                       where type = "fort" and owner {condition} location
                       and date >= {self.startfrom}
                       group by owner, time
                       order by time;"""

        # Captured then recovered forts
        for param in [ ["!=", ""], ["=", "0 -"] ]:
            self.sql.execute(query(param[0], param[1]))
            for r in self.sql.fetchall():
                if r["average"] is not None:
                    activity[r["owner"]][int(r["time"])] += r["average"]

        return activity

    def get_invasions(self):
        invasions = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        if self.sample_days is None:
            self.get_oldest_event()
        def query(condition, sign=""):
            return f"""select owner, strftime("%H", time(date, 'unixepoch')) as time,
                       {sign} cast(count(rowid) as float) / {self.sample_days} as average
                       from report
                       where type = "fort" and owner {condition} location
                       and name like "Great Wall of %"
                       and date >= {self.startfrom}
                       group by owner, time
                       order by time;"""

        # Captured then recovered forts
        for param in [ ["!=", ""], ["=", "0 -"] ]:
            self.sql.execute(query(param[0], param[1]))
            for r in self.sql.fetchall():
                invasions[r["owner"]][int(r["time"])] += r["average"]

        return invasions

    def get_gems(self):
        gems = {"Alsius": [0] * 24, "Ignis": [0] * 24, "Syrtis": [0] * 24}
        self.sql.execute(f"""select owner, strftime("%H", time(date, 'unixepoch')) as time,
                             count(rowid) as count
                             from report
                             where type="gem" and location != owner
                             group by owner, time;""")
        for r in self.sql.fetchall():
            gems[r["owner"]][int(r["time"])] = r["count"]

        return gems

    def generate_stats(self):

        for realm in self.stats:
            self.stats[realm] = {
                "forts": {
                    "total": 0,
                    "recovered": 0,
                    "captured": 0,
                    "most_captured": {
                        "name": None,
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
                       from report
                       where type = "fort" and owner {condition} location
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
                             from report
                             where type="fort" and owner != location
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
                             from report
                             where type = "fort" and owner != location
                             and name like "Great Wall of %"
                             and date >= {self.startfrom}
                             group by owner;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["invasions"]["last"]["location"] = r["location"]
            self.stats[r["realm"]]["invasions"]["last"]["date"] = r["date"]
            self.stats[r["realm"]]["invasions"]["count"] = r["count"]

        # Get the number of times a realm got invaded
        self.sql.execute(f"""select owner as realm, count(name) as count
                             from report
                             where type = "fort" and owner = location
                             and name like "Great Wall of %"
                             and date >= {self.startfrom}
                             group by location;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["invasions"]["invaded"]["count"] = r["count"]

        # Get last gem stolen date and total count
        self.sql.execute(f"""select owner as realm, max(date) as date, count(date) as count
                             from report
                             where type = "gem" and location != owner
                             and date >= {self.startfrom}
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
        # use 30 days max for the events
        self.sql.execute(f"""select *
                             from report
                             where date > unixepoch() - 30 * 24 * 3600
                             order by date desc""")
        # Since we're getting 15k events it's acceptable to not use a generator
        # as it's faster like this than calling json.dump() repeatedly
        output = [{"generated": int(datetime.now().timestamp())}]
        for r in self.sql.fetchall():
            output.append(dict(r))
        return output
