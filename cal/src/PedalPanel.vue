<!-- 
  Expanded pedalp details
  ex. "2025": {
     "alt": "Pedalpalooza logo for 2025",
     "enddate": "2025-08-31",
     "image": "/images/pp/pp-general-banner.png",
     "startdate": "2025-06-01",
     "target": "/pedalpalooza-calendar/",
     "title": "Pedalpalooza 2025",
     "type": "pp-landing"
   }
 -->
<script>
import pp from './pedalp.js'

export default {
  data() {
    return {
      image: pp.details.image,
      alt: pp.details.alt,
    }
  }
}
</script>
<template>
  <div class="c-pp">
    <img :alt :src="image" class="c-pp__img">
    <p>The next <a href="/pages/pedalpalooza/">Pedalpalooza</a> is coming!<br/> Stay tuned for more information, and be sure to follow <a href="https://www.bike-summer.org">Bike-Summer.org</a> and <a href="https://www.instagram.com/pedalpaloozapdx/">Pedalpalooza on Instagram</a> for updates!</p>
    <p>Seeking inspiration for your own ride?<br/>
      Visit the <a href="/archive/pedal-palooza-archives/">Pedalpalooza archives</a> to see rides from previous years.</p>
  </div>

</template>

<style>
.c-pp {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%; /* a little space around the edges */
  margin: 1em auto;
  border: var(--feature-border);
  color: var(--feature-text);
  background: var(--feature-bg);
}
.c-pp__img {
  width: 100%;
  height: auto;
  max-width: 438px;
}
.c-pp p {
  text-align: center;
  padding: 0 1em;
}
</style>