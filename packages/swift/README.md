# ProhibitedWord (SPM + CocoaPods)

Form profanity validation — 124 languages, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

## Swift Package Manager

```swift
dependencies: [.package(url: "https://github.com/qalvinahmad/prohibited-word.git", from: "0.1.0")]
```

## CocoaPods

```ruby
pod 'ProhibitedWord', '~> 0.1'
```

```swift
import ProhibitedWord

validate("kamu anjing").isValid              // false
containsProhibited("kamu 4nj1ng")            // true (leet)
validate("kamu jancok", locale: "jv")        // 124 languages via locale
validate("good 👍", locale: "en-AU")         // region-aware emoji
validate("kamu anjing", minSeverity: 3).isValid // severity threshold
```
