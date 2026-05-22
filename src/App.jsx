const migrateLocalData =
  async () => {
    try {
      const tort =
        DEFAULT_TORT.map(
          (i) => ({
            ...i,
            type: 'tort',
          })
        )

      const furn =
        DEFAULT_FURN.map(
          (i) => ({
            ...i,
            type: 'furn',
          })
        )

      const all = [
        ...tort,
        ...furn,
      ]

      const { error } =
        await supabase
          .from('Budget')
          .insert(all)

      if (error) {
        console.log(error)

        alert(
          JSON.stringify(error)
        )

        return
      }

      alert(
        'migrate success'
      )

      loadBudgets()
    } catch (e) {
      console.log(e)
    }
  }
