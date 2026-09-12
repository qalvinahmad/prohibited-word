# ProhibitedWord (SPM + CocoaPods)

Form profanity validation — 130 languages & locales, offline-first.
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

validate("piss off").isValid              // false
containsProhibited("you are sh1t")        // true (leet)
validate("good 👍", locale: "en-AU")      // region-aware emoji
validate("call +14155552671", detectors: ["pii"]).found.first?.type // "phone"
```
