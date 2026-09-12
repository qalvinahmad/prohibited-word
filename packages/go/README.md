# prohibitedword (Go) + CLI

Form profanity validation — 130 languages & locales, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```bash
go get github.com/qalvinahmad/prohibited-word/packages/go
```

```go
import pw "github.com/qalvinahmad/prohibited-word/packages/go"

r := pw.Validate("piss off", pw.Options{Locale: "en-US"})
// r.IsValid == false, r.Found[0].Word == "piss off"

pw.Contains("you are sh1t", pw.Options{})              // true (leet)
pw.Validate("good 👍", pw.Options{Locale: "en-AU"})   // region-aware emoji
```

## CLI (also via Homebrew)

```bash
go install github.com/qalvinahmad/prohibited-word/packages/go/cmd/prohibited-word@latest
# or: brew install qalvinahmad/tap/prohibited-word
prohibited-word --locale en-US "piss off"
prohibited-word --detectors pii --locale en-US "call +14155552671"
echo "hello how are you" | prohibited-word
```
