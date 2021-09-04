//@ts-ignore
import { test, assertEqual, run } from "@danielbartsch/testing"
import { wrapText, textLength, selectText } from "./animateText"
import * as textFormat from "./textFormat"

test("text below maximum length", () => {
  const text = "Short text"
  assertEqual(text, wrapText(text, 20))
})
test("text slightly above maximum length", () => {
  const text = "Short text"
  assertEqual("Short\ntext", wrapText(text, 9))
})
test("text longer words", () => {
  const text = "55555 88888888 22 21 1"
  assertEqual("55555\n88888888\n22 21 1", wrapText(text, 10))
})

test("text length without anything special", () => {
  assertEqual(5, textLength("hello"))
})
test("text length with unprinted characters such as \\0", () => {
  assertEqual(5, textLength("h\0e\0l\0l\0o\0\0\0\0"))
})
test("text length with formatting", () => {
  assertEqual(5, textLength(textFormat.red("hello")))
  assertEqual(5, textLength(textFormat.bold("hello")))
})

test("text selection normal", () => {
  const text = "Hello"
  assertEqual("", selectText(text, 0))
  assertEqual("H", selectText(text, 1))
  assertEqual("He", selectText(text, 2))
  assertEqual("Hel", selectText(text, 3))
  assertEqual("Hell", selectText(text, 4))
  assertEqual("Hello", selectText(text, 5))
})

test("text selection formatting", () => {
  const text = "He" + textFormat.red("ll") + "o"
  assertEqual("", selectText(text, 0))
  assertEqual("H", selectText(text, 1))
  assertEqual("He\x1b[31m", selectText(text, 2))
  assertEqual("He\x1b[31ml", selectText(text, 3))
  assertEqual("He" + textFormat.red("ll"), selectText(text, 4))
  assertEqual(text, selectText(text, 5))
})

run()
