# MAINTENANCE

This API endpoint allows to display a message on top of each
page, to warn for servers issues and potentially other stuff, if
`/api/var/maintenance.txt` exists and is non-empty.

It's checked every 15 minutes.

## URL

https://cort.ovh/api/var/maintenance.txt

## Usage

### Add a maintenance message

It's very obnoxious, since it pops long after the initial page loading in most
case. Use them with parcimony.

Create/Open the `maintenance.txt` file inside `/api/var`, and put your
maintenance message there. HTML is allowed, but javascript won't be run.
Usually it's something like:

```html
<div id="temporary-message" data-color="blue"
    data-en="english"
    data-es="spanish"
    data-de="german"
    data-fr="french"
>
</div>
```

This div id allows to automatically insert icons depending on the color, and
color the background in the given color:

- `red`: ⚠️  _message_ for alerts
- `blue`: ℹ️  _message_ for infos
- `green`: ✅ _message_ never used, for completion


### Remove a maintenance message

Just empty the file. It must be zero byte long.

It's not recommended to delete the file, for SEO reasons.

### Prescheduled maintenance message

You can use `cron` and various templates to preschedule maintenance messages, for example:

```cron
0   8   29  5   *   cd /where.is.cort/api/var && cp maintenance.epics_days.txt maintenance.txt
0   6   1   6   *   cd /where.is.cort/api/var && cp maintenance.empty.txt maintenance.txt
```

## Example templates

### Epics days

```
<div id="temporary-message" data-color="blue"
    data-en="There's a boss event from <a href='https://cort.go.yo.fr/event/?s=1780045200000&e=1780304400000&t=Epic%20days&m=Bosses%20won%27t%20respawn%20at%20their%20usual%20time' target='_blank'>May 29th at 9:00 AM (UTC) to June 1st at 9:00 AM (UTC)</a>; bosses won't respawn at their normal times."
    data-es="Hay un evento de épicos del <a href='https://cort.go.yo.fr/event/?s=1780045200000&e=1780304400000&t=Epic%20days&m=Bosses%20won%27t%20respawn%20at%20their%20usual%20time' target='_blank'>29 de mayo a las 9:00 (UTC) al 1 de junio a las 9:00 (UTC)</a>: los jefes no reaparecerán en sus horarios habituales."
    data-fr="Un événement de boss aura lieu du <a href='https://cort.go.yo.fr/event/?s=1780045200000&e=1780304400000&t=Epic%20days&m=Bosses%20won%27t%20respawn%20at%20their%20usual%20time' target='_blank'>29 mai à 9h (UTC) au 1er juin à 9h (UTC)</a> : les boss ne réapparaîtront pas à leurs heures habituelles."
    data-de="Ein Boss-Event findet vom <a href='https://cort.go.yo.fr/event/?s=1780045200000&e=1780304400000&t=Epic%20days&m=Bosses%20won%27t%20respawn%20at%20their%20usual%20time' target='_blank'>29. Mai um 9:00 Uhr (UTC) bis zum 1. Juni um 9:00 Uhr (UTC)</a> statt – Bosse erscheinen nicht zu ihren üblichen Zeiten."
></div>
```
