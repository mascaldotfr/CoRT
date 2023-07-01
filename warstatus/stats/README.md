# Warzone statistics

This directory includes the necessary code used to generate statistics.

`generate.py` is called by `../warstatus.py`. It writes new events in a sqlite3
database `events.sqlite` and generates a small JSON report called
`statistics.txt` if any change happened since the last run. The default output
directory is this very directory.

**You must have a working warstatus (see `/warstatus/README.md`) for statistics
to be generated.** You can disable statistics just by renaming `generate.py`.

It does not require extra installation of packages, excepted if your operating
system split sqlite3 from the main python distribution; in such case you'll
need the `python3-sqlite3` (or whatever it is called) package. You don't have
any extra step to perform, as `../warstatus.py` will do the necessary to make
it work.

The "API endpoint" URL is: https://hail.thebus.top/cortdata/warstatus/stats/statistics.json
The full database is publicly available at: https://hail.thebus.top/cortdata/warstatus/stats/events.sqlite


## Database format

This is a carbon copy of the warstatus events array. Please see `/warstatus/README.md`.

While the database could be optimized, according to benchmarks, each year of
events (~100000 events) is leading to an additional 300ms execution time, and a
database size increase of 4MB. Given the linearity of the increase, that's 3
seconds in 10 years. Which is acceptable, given that the script has at worst 1
minute to finish. All this on a cheap single core SSD VPS with 512MB of RAM.

Relics events are not recorded.

## Response format

Note that the frontend code exploiting the JSON report `/js/wstats.js` expects
the database has been populated since at least 24 hours and all events at least
occurred once in order to have some visible results.

Invasions and gems events may not be present during the first runs in the
following format.

A gem steal means that a realm (ex: Syrtis) has stolen a gem from another realm
(ex: Ignis). If Ignis recovered its own gem from Syrtis, it's not counted.

Dragon wishes are an estimate, false positive may happen **VERY** rarely but
they exist, see
https://discord.com/channels/542061814704373782/543072176841162763/1120071439349977198
for example.


```
[
  [
    {
      generated: "timestamp of generation",
      generation_time: "duration (s) of reports generation",
      activity: { // average number of enemy forts captured by realm and UTC hour }
      invasions: { // number of invasions by realm and UTC hour }
    }
  ],
  [{ # 7 days report
  	"Realm": {
	  forts: {
	   captured: "Total number of captured forts",
	   total: "Total number of captured and recovered forts",
	   recovered: "Total number of recovered forts"
	   most_captured: {
	     name: "Name of the most captured fort",
	     count: "Number of time said fort has been captured"
	     }
	  },
	   invasions: {
	     invaded: "Total number of time the realm has been invaded",
	     count: "Number of time the realm made an invasion"
	     last: {
	       location: "Last realm invaded",
	       date: "Timestamp of the last invasion"
	     }
	   },
	   gems: {
	   	stolen: "Timestamp of the last gem steal",
		count: "Number of gems stolen",
        lost: "Number of lost gems"
       },
       wishes: {
         last: "Timestamp of the last dragon wish",
         count: "Number of dragon wishes"
       }
     },
     [...Two more realms...]
  }
 ],
 [...30 days report, same format...]
]
```

## BUGS

The code is considered pretty naive by the way. I'm not very good with SQL.
If anyone contribute, please keep things simple.
