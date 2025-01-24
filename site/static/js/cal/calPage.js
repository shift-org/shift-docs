import TopBar from './topBar.js'
import CalList from './calList.js'
import BottomBar from './bottomBar.js'

export default {
  props: {
    siteinfo: Object,
  },
  template: `
<TopBar :siteinfo="siteinfo"/>
<CalList/>
<BottomBar/>
`,  
  components: { TopBar, CalList, BottomBar },
}


