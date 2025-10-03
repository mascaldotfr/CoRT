# Warzone statistics

This directory includes the necessary code used to generate statistics.

`generate.py` is called by `../warstatus.py`. It writes new events in a sqlite3
database `events.sqlite`. It generates a small JSON report called
`statistics.json` and big JSON one `allevents.json` containing a dump of the events
the last 3 days if any change happened since the last run. The default output
directory is `../../var` and can be modified in `../warstatus.py`.

On top of the generated files, pre compressed gzip files are generated. Please
see you web server documentation if you don't know how to activate the serving
of such files.

## Deployment

**You must have a working warstatus (see `/warstatus/README.md`) for statistics
to be generated.** You can disable statistics just by renaming `generate.py`.

It does not require extra installation of packages, excepted if your operating
system split sqlite3 from the main python distribution; in such case you'll
need the `python3-sqlite3` (or whatever it is called) package. You don't have
any extra step to perform, as `../warstatus.py` will do the necessary to make
it work.

Using static gzip compression in your web server is recommended, especially for
`events.json` which weights 500kb uncompressed but only 25kb compressed.

- The "API endpoint" for statistics URL is: https://cort.thebus.top/api/var/statistics.json
- The "API endpoint" for events URL is: https://cort.thebus.top/api/var/allevents.json
- The full database is publicly available at: https://cort.thebus.top/api/var/events.sqlite
- CSV dumps for use in Excel etc. can be found at: https://cort.thebus.top/api/var/dumps/

Unless you prepopulate your installation with the downloadable `events.sqlite`
above, it will need a few days to get meaningful graphs for the statistics.

### Dump generator

There is a way to generate a CSV dump with all historical events and a
(current) yearly one. It requires the `sqlite3` program to be installed.

Like you did in `warstatus` you can modify the crontab to include the following
line to make it run daily at 6:

```
    0 6 * * * cd /where/is/CoRT/warstatus/stats && ./dump_generator
```

## Database format

This is a carbon copy of the warstatus events array. Please see `/warstatus/README.md`.

While the database could be optimized, according to benchmarks, each year of
events (~100000 events) is leading to almost no increase in execution time, and
a database size increase of 4MB. Which is more than acceptable, given that the
script has at worst 1 minute to finish. All this on a cheap single core non
NVME SSD VPS with 512MB of RAM, by the way.

Events are never deleted, since anyway statistics are made from a temporary
table containing only the events needed, and as mentioned above using the
database as an all-time archive does not lead to an amazingly high overhead,
especially that the statistics API is [static](https://www.seancdavis.com/posts/lets-talk-about-static-apis/).

## Response format

###  events.json

This is a carbon copy of the warstatus events array. Please see `../warstatus/README.md`.

### statistics.json

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
      activity: { // average number of enemy forts captured by realm and UTC hour },
      invasions: { // average number of invasions by realm and UTC hour },
      wishes: { // number of dragon wishes by realm and UTC hour },
      fortsheld: {
        average: {
            "Alsius": [ // average fort holding time in minutes and per fort, in site order ],
            [... 2 other realms ...]
        },
        count: {
            "Alsius": [ // (int) enemy fort holding count per fort, in site order. 0 if the
                        // fort originally belongs to the realm (aka "recoveries aren't counted") ],
            [... 2 other realms ...]
        },
        total: {
            "Alsius": "(int) total forts holding time (in hours)",
            [... 2 other realms ...]
        }
      }
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
         stolen: {
           last: "Timestamp of the last gem steal",
		   count: "Number of gems stolen"
         }
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

The code is considered pretty naive by the way. I'm not very good with SQL.
If anyone contribute, please keep things simple.

Brotli precompressed files should be supported, but it requires extra
dependencies for negligible benefits on the output size given the traffic the
site generates.

### The sum of all the captured forts is not equal to the recovered ones

It's not a bug. Imagine this situation:

```
01:00 Alsius has captured Fort Samal
01:05 Syrtis has captured Fort Samal
01:20 Ignis has recovered Fort Samal
```

It's 2 captures for 1 recovery and it's totally legit. That's why a perfect
equality won't happen, unless the database is pretty empty.

### No lost gems count?

Lost gems cannot be reliably counted without major changes, imagine this
situation:

```
01:00 Alsius has captured Ignis gem#1
03:07 Syrtis has captured Ignis gem#1
```

- Ignis lost a gem
- Alsius get an enemy gem
- Syrtis stole that enemy gem from Alsius

Because the events has no mention of the previous owner, currently if we try to
count the lost gems, `Syrtis stole that enemy gem from Alsius` would be in
fact `Syrtis stole that enemy gem from Ignis`.

This can be fixed by storing the previous owner in the database, and ensuring
that:

- The original location, the previous owner, and the current owner are
  different. (`generate.py`, gems queries)
- But then dragon wishes need also to take this change into account, and
  requires that previous and current owner are different and that current owner
  is the same as the original location. (`../warstatus.py`)

That's possible, but i see this as too much complexity added for a single value
in a single type of event, especially that the dragon wishes and enemy
stolen gems counts give already a good idea on what's going on, and that
figuring out the problem took me too much time for my own code already.

I would refactor the code if the invasion system changes to take that into
account though.
