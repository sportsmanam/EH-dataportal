---
title: "Test Sections"
date: 2022-08-10T13:36:20-04:00
draft: false
tags: 
categories: 
keyTopic: 
keywords: 
layout: test-sections/template
datalibraries: true
---

<!-- rawhtml with % parses markdown -->
{{% rawhtml %}}


<!-- we can wrap our content with blocks using named divs -->
<div id="block1">

**This is block 1 in MD**

</div> <!-- id="block1" -->

This is after the end of block 1, and before block 2, so it shouldn't make it into the final page.

<br>

<div id="block2">

***This is block 2 in MD***

<br>

### This is a heading-3 in MD

<br>

some stuff under the heading
<br>

How about a list?
 - of maybe
 - meaningless words
 - just as a
 - test

<br>

# And now a partial called from a shortcode 


{{< partial "test-partial" >}}

</div> <!-- id="block2" -->

{{% /rawhtml %}}
