<script>
import siteConfig from './siteConfig.js'

export default {
  data() {
    return {
      disclaimer: siteConfig.disclaimer,
      }
    }
} 
</script>
<template>
  <div class="c-addendum">
    <div class="c-notice">
      <div>
        <div>Support your community!</div> <div>See how you can <a href="/pages/public-health/">help make bike fun safe for all</a>.</div>
      </div>
    </div>
    <div class="c-disclaimer">
      <p>{{ disclaimer }}</p>
    </div>
  </div>
</template>

<style>
 
/** tweaked from main.css */
.c-notice {
  text-align: center;
  color: var(--feature-text);
  background: var(--feature-bg);
  border: var(--feature-border);
  padding: 0.5em;
}
.c-disclaimer {
  font-size: small;
  margin: 0 auto;
  text-align: center;
  max-width: 50em;
  padding: 0 1em;
} 
</style>