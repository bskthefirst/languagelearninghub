# Japanese Learning Hub

Retro-style Japanese study app with:

- Naver dictionary search proxy (JA-KO + EN-KO auto-detection)
- Furigana, meaning, and example display
- Multiple custom lists
- Search history page
- Flashcards (flip + next/prev)
- Quiz mode (multiple choice + final score)

## Run

```bash
python3 app.py
```

Open: `http://127.0.0.1:8000`

## Notes

- Dictionary requests use `https://ja.dict.naver.com/api3/jako/search`.
- If Naver changes payload/anti-bot rules, search parsing may need updates in `app.py`.
- Lists/history are synced to an internal SQLite DB at `data/hub_state.db`.
- Browser `localStorage` is still used as a fast local cache.
