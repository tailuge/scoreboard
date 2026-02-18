import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Document from "../pages/_document"

// Standard mocks for Next.js internal document components
jest.mock("next/document", () => ({
  Html: ({ children, lang }: { children: React.ReactNode; lang?: string }) => (
    <html lang={lang}>{children}</html>
  ),
  Head: ({ children }: { children: React.ReactNode }) => (
    // eslint-disable-next-line @next/next/no-head-element
    <head>{children}</head>
  ),
  Main: () => <div id="next-script-target" />,
  NextScript: () => <div id="next-script-loader" />,
}))

describe("Custom Document Structure", () => {
  it("generates the expected static HTML foundation", () => {
    const output = renderToStaticMarkup(<Document />)

    // Check for essential attributes and tags
    expect(output).toContain('lang="en"')
    expect(output).toContain("<head>")
    expect(output).toContain('class="antialiased"')

    // Check for our custom script targets
    expect(output).toContain('<div id="next-script-target"></div>')
    expect(output).toContain('<div id="next-script-loader"></div>')

    // Verify presence of Google Font preconnects
    expect(output).toContain('rel="preconnect"')
    expect(output).toContain("fonts.gstatic.com")
  })
})
