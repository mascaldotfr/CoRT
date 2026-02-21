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
maintenance message there. HTML is allowed. Usually it's something like:

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
