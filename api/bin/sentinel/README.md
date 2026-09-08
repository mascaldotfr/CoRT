# SENTINEL API

This API endpoint has been tailor made for
https://sentinel.cort.ovh

It's an agregation of all other APIs, that have been quickly filtered so we
keep a small output response.

## URL

| Type                   | URL                                                |
|------------------------|----------------------------------------------------|
| Official               | https://cort.ovh/api/bin/sentinel/sentinel.php     |
| Local                  | https://yourhost/api/bin/sentinel/sentinel.php     |

## Response format

In JSON; I recommend you to check out API documentation for each of them, here
is a quick schema:

```
{
  "wz": {
    "forts": [
      {
        "name": "string (e.g., \"Imperia Castle (1)\")",
        "location": "string (\"Alsius\" | \"Ignis\" | \"Syrtis\")",
        "owner": "string (faction name)",
        "icon": "string (e.g., \"keep_alsius.gif\")"
      }
      // ... more fort objects
    ],
    "gems": [
      "string (e.g., \"gem_0.png\")",
      // ... one entry per gem slot
    ]
  },
  "stats": {
    "Alsius": {
      "gems": {
        "stolen": {
          "last": "number (Unix timestamp of last theft)",
          "count": "number (total gems stolen)"
        }
      },
      "wishes": {
        "count": "number (total wishes granted)",
        "last": "number (Unix timestamp of last wish)"
      }
    }
    // ... same for Ignis and Syrtis
  }
}
```
