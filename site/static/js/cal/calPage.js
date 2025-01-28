import TopBar from './topBar.js'
import CalList from './calList.js'
import QuickNav from './quickNav.js'

export default {
  props: {
    siteinfo: Object,
  },
  template: `
<TopBar :siteinfo="siteinfo"/>
<CalList/>
<QuickNav/>
`,  
  components: { TopBar, CalList, QuickNav },
}


