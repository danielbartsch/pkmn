//@ts-ignore
import { test, assertEqual, run } from "@danielbartsch/testing"
import { wrapText, textLength } from "./animateText"
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

run()
