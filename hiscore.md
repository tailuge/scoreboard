# High Score Submission

This document outlines the query parameters required when calling `hiscore.html` to submit a new high score.

## Query Parameters

The following query parameters must be appended to the `hiscore.html` URL:

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `ruletype` | `string` | The game rule type (e.g., `snooker`, `nineball`, `threecushion`). |
| `state` | `string` | A [JSONCrushed](https://github.com/KilledByAPixel/JSONCrush) string representing the game state. |

### The `state` Parameter

The `state` parameter, when uncrushed and parsed as JSON, must be an object with the following properties:

- `v`: `number` - The client version. Currently, this must be `1`.
- `score`: `number` - The score achieved in the game.

Example of the original JSON before crushing:
```json
{
  "v": 1,
  "score": 147
}
```

## Internal Behavior

When `hiscore.html` is loaded:
1. It extracts `ruletype` and `state` from the query parameters.
2. It displays a replay of the game in an iframe by passing all query parameters to the replay worker.
3. Upon user submission (after entering initials), it sends a POST request to `/api/hiscore` with `ruletype` and `id` (initials) in the URL and the entire original query string as the request body.
