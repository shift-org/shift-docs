<script>
/**
 * A list of icons describing a ride.
 * see also: calTags.js buildEventTags()
 */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' 
import icons from './icons.js';

export default {
  components: { FontAwesomeIcon },
  props: {
    tags: Object,
  },
  data() {
    return { 
      icons,
    }
  },
  methods: {
    // return a list of classes, ex:
    // c-tags__audience c-tags_audience-G
    tagClass(id, tag) {
      const short = tag.short || "unknown";
      return [`c-tag__${id}`, `c-tag__${id}-${short}`];
    }
  }
};
</script>

<template>
  <ul class="c-tags">
    <template v-for="(tag, id) in tags" :key="id">
      <li class="c-tag" :class="tagClass(id, tag)">
        <FontAwesomeIcon 
          class="c-tag__icon" v-if="tag.icon" :icon="tag.icon" 
          /><span class="c-tag__label" >{{tag.text}}</span>
          <a v-if="tag.link" :href="tag.link"
          target="_blank" rel="noopener nofollow external"
          ><FontAwesomeIcon 
            class="c-tag__link" 
            :icon="icons.get('externalLink')"
            /></a>
        </li>
    </template>
  </ul>
</template>

<style>
.c-tags {
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-flow: row wrap; 
  list-style-type: none;
  gap: 5px;
  /* on safari empty tags collapse, on chrome they take up space.
  this helps keep things consistent  */
  margin: 1em 0;
  padding-inline-start: 0px;
}
.c-tag {
  display: flex;
  border: 2px solid;
  border-radius: 5px;
  padding: 3px 5px;
  align-items: center;
  gap: 5px;
  background-color: var(--tag-bg);
}
.c-tag__label {
  color: var(--tag-text);
}
.c-tag__audience-a {
  color: red;
  border-color: darkorange;
  .c-tag__icon, .c-tag__link {
    color: darkorange;
    border-color: darkorange;
  }
}
.c-tag__audience-f {
  color: mediumseagreen;
  border-color: mediumseagreen;
  .c-tag__icon, .c-tag__link {
    color: mediumseagreen;
    border-color: mediumseagreen;
  }
}
.c-tag__safety {
  color: skyblue;
  border-color: skyblue; 
  .c-tag__icon, .c-tag__link {
    color: skyblue;
    border-color: skyblue; 
  }
}
.c-tag__cancelled {
  color: crimson;
  border-color: crimson; 
  .c-tag__icon, .c-tag__link {
    color: crimson;
    border-color: crimson; 
  }
}
</style>