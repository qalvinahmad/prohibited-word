# prohibitedword (Go) + CLI

Form profanity validation — 124 languages, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```bash
go get github.com/qalvinahmad/prohibited-word/packages/go
```

```go
import pw "github.com/qalvinahmad/prohibited-word/packages/go"

r := pw.Validate("kamu anjing", pw.Options{})
// r.IsValid == false, r.Found[0].Word == "anjing"

pw.Contains("kamu 4nj1ng", pw.Options{})              // true (leet)
pw.Validate("kamu jancok", pw.Options{Locale: "jv"})  // 124 languages
pw.Validate("good 👍", pw.Options{Locale: "en-AU"})   // region-aware emoji
```

## CLI (also via Homebrew)

```bash
go install github.com/qalvinahmad/prohibited-word/packages/go/cmd/prohibited-word@latest
# or: brew install qalvinahmad/tap/prohibited-word
prohibited-word --locale id-ID "kamu anjing"
echo "halo apa kabar" | prohibited-word
```
