# Complete List of HTML Elements for Semantic Web Development (2026)

Based on the MDN Web Docs reference (updated November 2025), this document provides a comprehensive list of all HTML elements that are widely supported and recommended for modern web development.

**Total Elements: ~110**

---

## Main Root

| Element | Description |
|---------|-------------|
| `<html>` | Root element of an HTML document |

---

## Document Metadata

| Element | Description |
|---------|-------------|
| `<head>` | Contains machine-readable information (metadata) about the document |
| `<title>` | Defines the document's title shown in browser tab |
| `<base>` | Specifies the base URL for all relative URLs in the document |
| `<link>` | Specifies relationships between current document and external resources |
| `<meta>` | Represents metadata that cannot be represented by other meta elements |
| `<style>` | Contains CSS style information for the document |

---

## Sectioning Root

| Element | Description |
|---------|-------------|
| `<body>` | Represents the content of an HTML document |

---

## Content Sectioning

| Element | Description |
|---------|-------------|
| `<header>` | Introductory content, typically navigation or heading elements |
| `<footer>` | Footer for its nearest sectioning content or sectioning root |
| `<main>` | Dominant content of the body of a document |
| `<nav>` | Section providing navigation links |
| `<article>` | Self-contained composition intended to be independently distributable |
| `<section>` | Generic standalone section of a document |
| `<aside>` | Content only indirectly related to the document's main content |
| `<h1>` | Heading level 1 (highest) |
| `<h2>` | Heading level 2 |
| `<h3>` | Heading level 3 |
| `<h4>` | Heading level 4 |
| `<h5>` | Heading level 5 |
| `<h6>` | Heading level 6 (lowest) |
| `<hgroup>` | Heading grouped with secondary content (subheadings, taglines) |
| `<address>` | Contact information for a person or organization |
| `<search>` | Contains form controls for search or filtering operations |

---

## Text Content

| Element | Description |
|---------|-------------|
| `<p>` | Represents a paragraph |
| `<div>` | Generic container for flow content (no semantic meaning) |
| `<pre>` | Preformatted text, displayed exactly as written |
| `<blockquote>` | Extended quotation |
| `<ol>` | Ordered list |
| `<ul>` | Unordered list |
| `<li>` | List item |
| `<dl>` | Description list |
| `<dt>` | Term in a description list |
| `<dd>` | Description/definition in a description list |
| `<figure>` | Self-contained content with optional caption |
| `<figcaption>` | Caption for a `<figure>` element |
| `<hr>` | Thematic break between paragraph-level elements |
| `<menu>` | Semantic alternative to `<ul>` for menus |

---

## Inline Text Semantics

| Element | Description |
|---------|-------------|
| `<a>` | Hyperlink to web pages, files, email addresses, etc. |
| `<span>` | Generic inline container (no semantic meaning) |
| `<strong>` | Strong importance, seriousness, or urgency |
| `<em>` | Stress emphasis |
| `<b>` | Bring attention to text (not importance) |
| `<i>` | Idiomatic text, technical terms, taxonomical designations |
| `<u>` | Non-textual annotation (underline) |
| `<s>` | Content no longer relevant or accurate (strikethrough) |
| `<small>` | Side comments and small print |
| `<mark>` | Highlighted/marked text for reference |
| `<q>` | Short inline quotation |
| `<cite>` | Title of a creative work |
| `<code>` | Fragment of computer code |
| `<kbd>` | Keyboard input |
| `<samp>` | Sample output from a computer program |
| `<var>` | Variable in a mathematical expression or programming context |
| `<dfn>` | Term being defined |
| `<abbr>` | Abbreviation or acronym |
| `<time>` | Specific period in time |
| `<data>` | Links content with a machine-readable translation |
| `<sub>` | Subscript text |
| `<sup>` | Superscript text |
| `<ruby>` | Ruby annotation (for East Asian typography) |
| `<rt>` | Ruby text component |
| `<rp>` | Fallback parentheses for ruby annotations |
| `<bdi>` | Bidirectional isolation |
| `<bdo>` | Bidirectional text override |
| `<br>` | Line break |
| `<wbr>` | Word break opportunity |

---

## Image and Multimedia

| Element | Description |
|---------|-------------|
| `<img>` | Embeds an image |
| `<picture>` | Container for multiple image sources for responsive images |
| `<source>` | Specifies multiple media resources for `<picture>`, `<audio>`, or `<video>` |
| `<audio>` | Embeds sound content |
| `<video>` | Embeds video content |
| `<track>` | Timed text tracks for `<audio>` and `<video>` (subtitles, captions) |
| `<map>` | Defines an image map |
| `<area>` | Defines a clickable area inside an image map |

---

## Embedded Content

| Element | Description |
|---------|-------------|
| `<iframe>` | Nested browsing context (embeds another HTML page) |
| `<embed>` | Embeds external content (plugins, etc.) |
| `<object>` | External resource (image, nested browsing context, or plugin resource) |
| `<fencedframe>` | Privacy-preserving nested browsing context *(experimental)* |

---

## SVG and MathML

| Element | Description |
|---------|-------------|
| `<svg>` | Container for SVG graphics |
| `<math>` | Top-level element for MathML mathematical expressions |

---

## Scripting

| Element | Description |
|---------|-------------|
| `<script>` | Embeds or references executable code (typically JavaScript) |
| `<noscript>` | Fallback content when scripting is disabled |
| `<canvas>` | Container for drawing graphics via scripting (Canvas API, WebGL) |

---

## Demarcating Edits

| Element | Description |
|---------|-------------|
| `<ins>` | Text that has been added to a document |
| `<del>` | Text that has been deleted from a document |

---

## Table Content

| Element | Description |
|---------|-------------|
| `<table>` | Tabular data |
| `<caption>` | Caption/title of a table |
| `<colgroup>` | Group of columns in a table |
| `<col>` | Column within a `<colgroup>` |
| `<thead>` | Table header rows |
| `<tbody>` | Table body rows |
| `<tfoot>` | Table footer rows |
| `<tr>` | Table row |
| `<th>` | Table header cell |
| `<td>` | Table data cell |

---

## Forms

| Element | Description |
|---------|-------------|
| `<form>` | Document section containing interactive controls for submitting information |
| `<fieldset>` | Groups controls and labels within a form |
| `<legend>` | Caption for a `<fieldset>` |
| `<label>` | Caption for a user interface item |
| `<input>` | Interactive control for data input |
| `<button>` | Clickable button |
| `<select>` | Control providing a menu of options |
| `<option>` | Item in a `<select>`, `<optgroup>`, or `<datalist>` |
| `<optgroup>` | Group of options within a `<select>` |
| `<datalist>` | Contains `<option>` elements for autocomplete |
| `<textarea>` | Multi-line text input |
| `<output>` | Container for calculation results or user action outcomes |
| `<progress>` | Progress indicator |
| `<meter>` | Scalar value within a known range |
| `<selectedcontent>` | Displays currently selected `<option>` in closed `<select>` *(experimental)* |

---

## Interactive Elements

| Element | Description |
|---------|-------------|
| `<details>` | Disclosure widget for showing/hiding content |
| `<summary>` | Summary/label for a `<details>` element |
| `<dialog>` | Dialog box or modal |

---

## Web Components

| Element | Description |
|---------|-------------|
| `<template>` | HTML fragment not rendered initially but can be instantiated via JavaScript |
| `<slot>` | Placeholder inside a web component for custom markup |

---

## Deprecated/Obsolete Elements (Do Not Use)

The following elements are deprecated or obsolete and should **not** be used in modern web development:

| Element | Status |
|---------|--------|
| `<acronym>` | Deprecated - use `<abbr>` instead |
| `<big>` | Deprecated - use CSS instead |
| `<center>` | Deprecated - use CSS instead |
| `<dir>` | Deprecated - use `<ul>` instead |
| `<font>` | Deprecated - use CSS instead |
| `<frame>` | Deprecated |
| `<frameset>` | Deprecated |
| `<marquee>` | Deprecated |
| `<nobr>` | Deprecated - use CSS instead |
| `<noembed>` | Deprecated |
| `<noframes>` | Deprecated |
| `<param>` | Deprecated |
| `<plaintext>` | Deprecated |
| `<rb>` | Deprecated |
| `<rtc>` | Deprecated |
| `<strike>` | Deprecated - use `<s>` or `<del>` instead |
| `<tt>` | Deprecated - use `<code>`, `<kbd>`, or `<samp>` instead |
| `<xmp>` | Deprecated - use `<pre>` and `<code>` instead |
| `<command>` | Removed from spec |
| `<keygen>` | Deprecated |
| `<menuitem>` | Removed from spec |

---

## Quick Reference by Category

### Semantic Structure Elements (Most Important for SEO & Accessibility)

```
<header> <footer> <main> <nav> <article> <section> <aside> <search>
```

### Heading Hierarchy

```
<h1> → <h2> → <h3> → <h4> → <h5> → <h6>
```

### Text Emphasis (Semantic)

```
<strong> (important) | <em> (emphasis) | <mark> (highlighted)
```

### Text Styling (Non-semantic)

```
<b> (attention) | <i> (alternate voice) | <u> (annotation) | <s> (no longer accurate)
```

### Lists

```
<ul>/<ol> + <li> (unordered/ordered lists)
<dl> + <dt> + <dd> (description lists)
<menu> + <li> (menu lists)
```

### Media

```
<img> <picture> <video> <audio> <source> <track>
```

### Forms

```
<form> <input> <button> <select> <textarea> <label> <fieldset> <legend>
```

### Tables

```
<table> <thead> <tbody> <tfoot> <tr> <th> <td> <caption>
```

---

## Resources

- [MDN HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements)
- [HTML Living Standard](https://html.spec.whatwg.org/)
- [Web.dev Semantic HTML Guide](https://web.dev/learn/html/semantic-html)

---

*Last updated: February 2026*