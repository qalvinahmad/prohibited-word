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
	r := pw.Validate(text, pw.Options{Locale: *locale, Lang: langs})
	if r.IsValid {
		fmt.Println("clean")
		return
	}
	fmt.Println("prohibited:")
	for _, f := range r.Found {
		fmt.Printf("- %s (%s, sev %d, %s)\n", f.Word, f.Category, f.Severity, f.Via)
	}
	os.Exit(1)
}
