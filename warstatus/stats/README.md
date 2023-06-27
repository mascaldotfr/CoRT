# Warzone statistics

This directory includes the necessary code used to generate statistics.

`generate.py` is called by `../warstatus.py`. It writes new events in a sqlite3
database `events.sqlite` and generates a small JSON report in this directory
called `statistics.txt` if any change happened since the last run.

It does not require extra installations, excepted if your operating system
split sqlite3 from the main python distribution; in such case you'll need the
`python3-sqlite` (or whatever it is called) package. You don't have any extra
step, as `../warstatus.py` with do the necessary to make it work.

The "API endpoint" URL is: https://hail.thebus.top/cortdata/warstatus/stats/statistics.json
The full database is publicly available at: https://hail.thebus.top/cortdata/warstatus/stats/events.sqlite

As the time of writing this, this is in beta stage. Due to uncertainity, I
can't give a refresh interval, because i will have to assert performance once
the database is stuffed, and act accordingly. But according to benchmarks, a
run would last 1 second in a few years (from ~15ms currently), if there is an
average of 250 events a day.

Relics events are not recorded.

## Database format

This is a carbon copy of the warstatus events array. Please see `warstatus/README.md`.

## Reponse format

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
      generation_time: "duration (s) of reports generation"
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
 [...30 days report, same format...],
 [...90 days report, same format...]
]
```

## BUGS

The code is considered pretty naive by the way. I'm not very good with sqlite.
If anyone contribute, please keep things simple.
