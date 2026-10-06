export default defineAppConfig({
  ui: {
    colors: {
      primary: 'coffee',
      neutral: 'stone'
    },
    card: {
      slots: { root: 'beans-surface' }
    },
    modal: {
      slots: { content: 'beans-surface' }
    },
    input: {
      variants: {
        variant: {
          outline: 'beans-control',
          soft: 'beans-control',
          subtle: 'beans-control'
        }
      }
    },
    button: {
      variants: {
        variant: {
          solid: 'beans-control',
          outline: 'beans-control',
          soft: 'beans-control',
          subtle: 'beans-control'
        }
      }
    }
  }
})
