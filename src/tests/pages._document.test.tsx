import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Document from "../pages/_document"

// Mock next/document components as they expect a specific context
jest.mock("next/document", () => ({
  Html: ({ children, lang }: { children: React.ReactNode, lang?: string }) => <html lang={lang}>{children}</html>,
  Head: ({ children }: { children: React.ReactNode }) => <head>{children}</head>,
  Main: () => <div id="main" />,
  NextScript: () => <div id="next-script" />,
}))

describe("_document", () => {
  it("renders correct static markup", () => {
    const markup = renderToStaticMarkup(<Document />)
    expect(markup).toContain('lang="en"')
    expect(markup).toContain('<head>')
    expect(markup).toContain('<body class="antialiased">')
    expect(markup).toContain('<div id="main"></div>')
    expect(markup).toContain('<div id="next-script"></div>')
    expect(markup).toContain('rel="preconnect"')
  })
})
