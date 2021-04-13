import { commandsHandlers } from '../../packages/web/utils/operations.js'

/* page */

Cypress.Commands.add('kernelDone', (options) => {
  cy.window().its('$nuxt.$store.state.kernel', options).should('equal','done')
})

Cypress.Commands.add('promisesDone', (options) => {
  cy.window().its('promises', options).should((options) => {
    expect(Object.keys(options).filter(k=>k==+k)).to.have.length(0)
  })
})

Cypress.Commands.add('allDone', (options) => {
  cy.wait(1000)
  cy.kernelDone(options)
  cy.promisesDone(options)
  cy.get('#footer-loading-status', options).should('not.exist')
})


/* fields */

Cypress.Commands.add('fieldField', (key, value, field) => {
  cy.get('#field-'+key)
    .clear({force: true})
    .type(value, { parseSpecialCharSequences: true, force: true })
    .should('have.value', value)
})

Cypress.Commands.add('numberField', (key, value, field) => {
  cy.get('#field-'+key)
    .clear({force: true})
    .type(value, { parseSpecialCharSequences: true, force: true })
    .should('have.value', value)
})

Cypress.Commands.add('chipsField', (key, value, field) => {
  let _value = value
  if (Array.isArray(_value)) {
    _value = _value.join('\n\r')+'\n\r'
  }
  cy.get('#field-'+key)
    .clear({force: true})
    .type(_value, { parseSpecialCharSequences: false, force: true })
})

Cypress.Commands.add('selectField', (key, value, field) => {
  cy.get('#field-'+key)
    .click({force: true})
  cy.get(`.v-select-list [data-value='${value}']`)
    .click({force: true})
})

/* bumblebee */

Cypress.Commands.add('clearSelection', (type = 'commands') => {

  cy.get('body').then((body) => {
    let btn = body.find('#details-close-btn')[0]
    if (btn) {
      cy.get('#details-close-btn').click()
    }
  })
})

Cypress.Commands.add('cancelCommand', (type = 'commands') => {

  cy.get('body').then((body) => {
    let container = body.find('.operation-form-container')[0]
    if (!container) {
      let toolbarBtn = body.find('#toolbar-icon-cells')[0]
      if (toolbarBtn && !toolbarBtn.disabled && !toolbarBtn.classList.contains('active')) {
        cy.get('#toolbar-icon-cells').click()
      }
    }

    let btn = body.find('#btn-command-cancel')[0]
    if (btn) {
      cy.get('#btn-command-cancel').click()
    }
  })
})

Cypress.Commands.add('clearCommands', (type = 'commands') => {

  cy.get('body').then((body) => {

    let btn = body.find('#toolbar-icon-cells')[0]
    if (btn && !btn.disabled) {
      cy.wait(100)
      console.log(btn)
      if (!btn.classList.contains('active')) {
        cy.get('#toolbar-icon-cells').click()
      }
      let elements = body.find(`.${type}-cells > .cell-container`)
      for (let i = 0; i < elements.length; i++) {
        cy.wait(100)
        cy.get(`.${type}-cells > .cell-container:last-child > .cell > .right-cell-btn`).click()
      }
      btn = body.find('#toolbar-icon-cells:not(.active)')[0]
      if (btn && !btn.disabled) {
        cy.get('#toolbar-icon-cells').click()
      }
    }
  })


})

Cypress.Commands.add('clearTabs', () => {

  cy.get('body').then((body) => {

    let elements = body.find(`.tab-close > .v-icon`)
    for (let i = 0; i < elements.length - 1; i++) {
      cy.wait(100)
      cy.get(`:nth-child(2) > .tab-close > .v-icon`).click()
    }
  })


})

Cypress.Commands.add('login', (testUsername, testPassword) => {
  cy.getCookie('x-access-token').then((c) => {
    if (!c) {
      cy.clearCookie('x-access-token')
      cy.visit('http://localhost:3000/')
      cy.location('pathname').should('include', 'login')
      cy.get('#login-field-username')
        .type(testUsername).should('have.value', testUsername)
      cy.get('#login-field-password')
        .type(testPassword).should('have.value', testPassword)
      cy.get('#login-btn-signin').click()
      cy.wait(1500)
      cy.location('pathname').should('not.include', 'login').should('include', 'workspaces')
    }
  })
})

Cypress.Commands.add('testOperation', (operation, enableScreenshots) => {

  let locationScreenshot = false

  let dataframes = operation.test ? operation.test.dataframes : []


  if (dataframes.length) {

    cy.window().then((win) => {
      win.showCreate = true
    })

    for (let i = 0; i < dataframes.length; i++) {
      cy.allDone({timeout: 30000})
      const dataframe = dataframes[i]
      cy.get('body').then((body) => {
        let clearTab = body.find('#bb-tab-undefined')[0]
        if (clearTab) {
          cy.get('#bb-tab-undefined').click()
        } else {
          cy.get('.new-tab').click()
        }
      })
      cy.get('#menu-DATA_SOURCE').click()
      cy.get('#menu-item-createDataframe').click()
      cy.get('#field-dict')
        .clear()
        .type(dataframe, {parseSpecialCharSequences: false})
        .should('have.value', dataframe)
      cy.allDone({timeout: 30000})
      cy.get('#btn-command-submit').click()
    }

  }

  cy.allDone({timeout: 30000})

  /* columns selection */

  let payloads = operation.test ? operation.test.payloads : [false]

  let commandHandler = commandsHandlers[operation.command] || commandsHandlers[operation.generator]

  if (commandHandler && commandHandler.dialog && commandHandler.dialog.fields) {

    for (let i = 0; i < /*payloads.length*/ 1; i++) {

      const payload = payloads[i]

      cy.allDone({timeout: 30000})
      cy.clearSelection()
      cy.clearCommands('commands')
      cy.allDone({timeout: 30000})

      let dfName = payload ? payload.dfName : false

      if (dfName) {
        cy.get(`#bb-tab-${dfName}`).click()
        cy.allDone({timeout: 30000})
      }

      let columns = payload ? payload.columns : false

      let columnElements = columns ? columns.map(column => `#bb-table-${column} > .column-header-cell`) : [`.bb-table-h-cell:first-child`]

      for (let i = 0; i < columnElements.length; i++) {
        const columnElement = columnElements[i]
        cy.wait(300)
        cy.get(columnElement, { timeout: 20000 })
          .click({ctrlKey: true})
      }

      cy.allDone({timeout: 30000})

      let toolbarItem = operation.group ? `#menu-${operation.group} > .icon-btn` : `#btn-${operation.command} > .icon-btn`
      let menuItem = operation.group ? `#menu-item-${operation.command}` : false

      /* screenshot location */

      cy.get(toolbarItem)
        .then(($el) => {
          let $0 = $el.get(0)
          $0.classList.add('--highlight-btn')
        })

      if (menuItem) {
        cy.get(toolbarItem)
          .click()

        cy.get(menuItem)
          .then(($el) => {
            let $0 = $el.get(0)
            $0.classList.add('--highlight-menu')
          })
      }

      if (enableScreenshots && !locationScreenshot) {
        cy.wait(1000)
        cy.screenshot(`location/${operation.command}--0`, { capture: 'viewport' })
        locationScreenshot = true
      }

      cy.get(toolbarItem)
        .then(($el) => {
          let $0 = $el.get(0)
          $0.classList.remove('--highlight-btn')
        })

      if (menuItem) {
        cy.get(menuItem)
          .then(($el) => {
            let $0 = $el.get(0)
            $0.classList.remove('--highlight-menu')
          })
      }

      /* starts the operation */

      cy.get(menuItem || toolbarItem)
        .click()

      let hasFields = false

      if (payload) {
        for (const key in payload) {
          if (Object.hasOwnProperty.call(payload, key) && key !== 'columns' && key !== 'dfName') {
            let value = payload[key]
            switch (key) {
              case 'output_cols':
                for (let j = 0; j < value.length; j++) {
                  cy.fieldField(`output-col-${j}`, value[j])
                }
                break

              default:
                hasFields = true
                let field = commandHandler.dialog.fields.find((field) => field.key === key)
                if (field) {
                  cy[`${field.type}Field`](key, value, field)
                }
                break
            }
          }
        }
      }



      if (enableScreenshots) {
        let preview = commandHandler.payload([""]).preview
        cy.wait(1000)
        cy.get('.v-footer > .layout').click({force: true})
        if (hasFields) {
          cy.get('#operation-form')
            .invoke('css', { 'height': 'auto', 'padding-bottom': '18px' })
            .screenshot(`form/${operation.command}--${i}`)
        }

        if (preview) {
          cy.get('.bumblebee-table-container')
            .then(($el) => {
              let $0 = $el.get(0)
              $0.classList.add('--minimal-table')
            })
          cy.get('.bbt-container')
            .screenshot(`table/${operation.command}--${i}`)
          cy.get('.bumblebee-table-container')
            .then(($el) => {
              let $0 = $el.get(0)
              $0.classList.remove('--minimal-table')
            })
        }

      }

      cy.allDone({timeout: 30000})

      cy.get('#btn-command-submit')
        .click()

      cy.allDone({timeout: 30000})

    }
  }
})

/* overwrites */

Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  originalFn(url, options)
    cy.get('#intercom-frame', { timeout: 20000 })
    .then(($el) => {
      let $0 = $el.get(0)
      $0.parentElement.removeChild($0)
    })
})

