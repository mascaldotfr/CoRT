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

from datetime import datetime, timedelta
import json
import sqlite3
import sys
from timeit import default_timer as timer

db_file = "stats/events.sqlite"
outfile = "stats/statistics.txt"
db_schema = """
create table if not exists events (
    date integer not null,
    name text not null,
    location text not null,
    owner text not null,
    type text not null
);
"""


def statistics(events):
    start_time = timer()
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Exception as e:
        print("Failed to create a database connection to", db_file, ":", e)
        sys.exit(1)

    conn.row_factory = sqlite3.Row
    sql = conn.cursor()
    try:
        sql.execute("select count(*) from events limit 1;")
    except:
        try:
            sql.executescript(db_schema)
        except Exception as e:
            print("Failed to create db: ", e)
            sys.exit(1)

    insert_queries = []
    sql.execute("select max(date) from events;")
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
        full_report = [{"generated": int(datetime.now().timestamp())}]
        for days in [7, 30, 90]:
            reporter = Reporter(conn, days)
            full_report.append(reporter.generate_stats())
        end_time = timer()
        full_report[0]["generation_time"] = end_time - start_time;
        with open(outfile, "w") as jsonfile:
            json.dump(full_report, jsonfile)







class Reporter:

    def __init__(self, conn, lastxdays):
        self.conn = conn
        self.sql = self.conn.cursor()
        self.startfrom = datetime.now() - timedelta(days=lastxdays)
        self.startfrom = self.startfrom.timestamp()
        self.stats = {"Alsius": {}, "Ignis": {}, "Syrtis": {}}

    def generate_stats(self):
        # Total forts captures per realm
        self.sql.execute(f"""select owner as realm, count(rowid) as count
                            from events
                            where type = "fort"
                            and date > {self.startfrom}
                            group by owner;""")
        for r in self.sql.fetchall():
             self.stats[r["realm"]]["forts"] = {}
             self.stats[r["realm"]]["forts"]["total"] = r["count"]

        # Total forts recapture per realm
        self.sql.execute(f"""select owner as realm, count(rowid) as count
                            from events
                            where type = "fort" and owner = location
                            and date > {self.startfrom}
                            group by owner;""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["forts"]["recovered"] = r["count"]

        # Deduce foreign forts captures
        for realm in self.stats:
            self.stats[realm]["forts"]["captured"] = \
                self.stats[realm]["forts"]["total"] - self.stats[realm]["forts"]["recovered"]

        # Get most captured forts by realm
        self.sql.execute(f"""select  owner as realm, name, count(name) as count
                             from events
                             where type="fort" and owner != location
                             and date > {self.startfrom}
                             group by owner, name
                             order by count(name) asc;""")
        for r in self.sql.fetchall():
            if "most_captured" in self.stats[r["realm"]]:
                continue
            self.stats[r["realm"]]["forts"]["most_captured"] = {}
            self.stats[r["realm"]]["forts"]["most_captured"]["name"] = r["name"]
            self.stats[r["realm"]]["forts"]["most_captured"]["count"] = r["count"]

        # Get count of invasions and last invasion by realm
        self.sql.execute(f"""select  owner as realm, location, max(date) as date, count(name) as count
                             from events
                             where type="fort" and owner != location
                             and name like "Great Wall of %"
                             and date > {self.startfrom}
                             group by owner
                             order by date desc;""")
        for r in self.sql.fetchall():
            if "invasions" not in self.stats[r["realm"]]:
                self.stats[r["realm"]]["invasions"] = {}
            self.stats[r["realm"]]["invasions"]["last"] = {}
            self.stats[r["realm"]]["invasions"]["last"]["location"] = r["location"]
            self.stats[r["realm"]]["invasions"]["last"]["date"] = r["date"]
            self.stats[r["realm"]]["invasions"]["count"] = r["count"]

        # Get the number of times a realm got invaded
        self.sql.execute(f"""select owner as realm, count(name) as count
                             from events
                             where type="fort" and owner = location
                             and name like "Great Wall of %"
                             and date > {self.startfrom}
                             group by location;""")
        for r in self.sql.fetchall():
            if "invasions" not in self.stats[r["realm"]]:
                self.stats[r["realm"]]["invasions"] = {}
            self.stats[r["realm"]]["invasions"]["invaded"] = {}
            self.stats[r["realm"]]["invasions"]["invaded"]["count"] = r["count"]

        # Get last gem stolen date and total count
        self.sql.execute(f"""select owner as realm, date, count(date) as count
                             from events
                             where type="gem" and location != owner
                             and date > {self.startfrom}
                             group by owner
                             order by max(date);""")
        for r in self.sql.fetchall():
            self.stats[r["realm"]]["gems"] = {}
            self.stats[r["realm"]]["gems"]["stolen"] = r["date"]
            self.stats[r["realm"]]["gems"]["count"] = r["count"]

        # Get last dragon wish and wishes count
        self.sql.execute(f"""select location as realm, count(rowid) as count, date
                             from events
                             where type="wish"
                             and date > {self.startfrom}
                             group by location
                             order by max(date);""")
        for r in self.sql.fetchall():
            if "wishes" not in self.stats[r["realm"]]:
                self.stats[r["realm"]]["wishes"] = {}
            self.stats[r["realm"]]["wishes"]["last"] = r["date"]
            self.stats[r["realm"]]["wishes"]["count"] = r["count"]

        return self.stats
