Pod::Spec.new do |s|
  s.name         = 'ProhibitedWord'
  s.version      = '0.1.0'
  s.summary      = 'Prohibited-word form validation, 124 languages, offline.'
  s.homepage     = 'https://github.com/qalvinahmad/prohibited-word'
  s.license      = { type: 'MIT', file: 'LICENSE' }
  s.author       = { 'qalvinahmad' => 'https://github.com/qalvinahmad' }
  s.source       = { git: 'https://github.com/qalvinahmad/prohibited-word.git', tag: s.version.to_s }
  s.ios.deployment_target = '13.0'
  s.source_files = 'packages/swift/Sources/ProhibitedWord/**/*.{swift}'
  s.resources    = 'packages/swift/Sources/ProhibitedWord/**/*.json'
  s.swift_version = '5.9'
end
