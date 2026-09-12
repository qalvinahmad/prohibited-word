package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strings"

	pw "github.com/qalvinahmad/prohibited-word/packages/go"
)

func main() {
	locale := flag.String("locale", "", "locale seperti id-ID atau ar-SA")
	lang := flag.String("lang", "", "batasi bahasa, koma-pisah (id,en)")
	detectors := flag.String("detectors", "profanity", "layer koma-pisah: profanity,pii,scam,sensitive")
	flag.Parse()
	var text string
	if flag.NArg() > 0 {
		text = strings.Join(flag.Args(), " ")
	} else {
		text, _ = bufio.NewReader(os.Stdin).ReadString('\n')
	}
	var langs []string
	if *lang != "" {
		langs = strings.Split(*lang, ",")
	}
	r := pw.Validate(text, pw.Options{Locale: *locale, Lang: langs, Detectors: strings.Split(*detectors, ",")})
	if r.IsValid && !r.NeedsReview && !r.NeedsHelp {
		fmt.Println("clean")
		return
	}
	if r.IsValid {
		fmt.Println("needs attention:")
	} else {
		fmt.Println("prohibited:")
	}
	for _, f := range r.Found {
		fmt.Printf("- %s (%s/%s, %s, sev %d, conf %.2f)\n", f.Word, f.Detector, f.Type, f.Action, f.Severity, f.Confidence)
	}
	os.Exit(1)
}
