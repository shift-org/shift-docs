<script>
export default {
  props: {
    href: {
      type: String,
      required: true,
    }
  }
}
</script>
<template>
<a :href
    target="_blank" 
    rel="noopener nofollow external" 
    title="Opens in a new window">
  <slot></slot>
</a>  
</template>

