<template src="extras/festivalHeader.html">
</template>
<style>
.pp-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%; /* a little space around the edges */
  margin: 1em auto;
  border: var(--orangey-border);
  color: var(--feature-text);
  background: var(--feature-bg);
 
  img {
    width: 100%;
    height: auto;
    max-width: 438px;
  }
  .expand-details {
    display: none;
  }
  .pp-headline {
    font-weight: bold;
    font-size: 24px;
    display: block;
  }
   /* see also c-notice */
  .donate {
    display: flex;
    flex-direction: column;
    align-items: center;
    a {
      text-align: center;
      background-color: var(--divider-bg);
      border: var(--brightend-border);
      border-radius: 12px;
      padding: .25em 1em;
    }
    p {
      display: flex;
      flex-direction: row;
      gap: 10px;
      align-items: center;
      margin: 0.25em;
    }
  }
  #pp-description {
    text-align: justify;
    max-width: 90%;
    margin: 0 auto;
  }
}
.c-pp p {
  text-align: center;
  padding: 0 1em;
}
</style>