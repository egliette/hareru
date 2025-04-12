# Youtube Dictation Website

Practicing dictation with youtube videos

## Installation

Install dependencies:

```
pip install -r requirements.txt
```

## Usage

Start server:

```
uvicorn app.server:app --reload
```

Your website will be available at "http://localhost:8000/"

## Todo

- [x] Toggle check button into next button
- [x] Clear hint when press next or back
- [x] Auto clear when go to next segment
- [x] Add setting
- [x] Responsive UI
- [ ] Add random chatbot
- [ ] Add Ads