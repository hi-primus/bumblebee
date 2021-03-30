/// <reference types="cypress" />

import { operations, commandsHandlers } from '../../packages/web/utils/operations.js'

let testOperations = operations.filter(operation => operation.test)

let testUsername = 'admin'
let testPassword = 'admin'

context('Navigation', () => {

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('x-access-token')
  })

  it('login', () => {
    cy.getCookie('x-access-token').then((c) => {
      if (!c) {
        cy.clearCookie('x-access-token')
        cy.visit('http://localhost:3000/')
        cy.location('pathname').should('include', 'login')
        cy.get('#login-field-username')
          .type(testUsername, { delay: 100 }).should('have.value', testUsername)
        cy.get('#login-field-password')
          .type(testPassword, { delay: 100 }).should('have.value', testPassword)
        cy.get('#login-btn-signin').click()
        cy.wait(1500)
        cy.location('pathname').should('not.include', 'login').should('include', 'workspaces')
      }
    })

  })

  testOperations.forEach(operation => {

    it(`${operation.operation} operation`, () => {

      cy.visit('http://localhost:3000/workspaces/blank-workspace')

      cy.location('pathname').should('not.include', 'login')

      /* clean up operations */

      cy.allDone({timeout: 30000})

      cy.get('#toolbar-icon-cells').then(($el) => {
        let $0 = $el.get(0)
        if (!$0.disabled) {
          console.log($0)
          $0.click()
          cy.get('.commands-cells > .cell-container > .cell > .right-cell-btn')
            .then($el => {
              if ($el) {
                $el.click({ multiple: true, delay: 1000 })
              }
            })
          cy.get('.data-sources-cells > .cell-container > .cell > .right-cell-btn')
            .then($el => {
              if ($el) {
                $el.click({ multiple: true, delay: 1000 })
              }
            })
        }
      })

      /* load test dataframes */

      cy.allDone({timeout: 30000})

      let dataframes = operation.test.dataframes

      if (dataframes.length) {

        cy.window().then((win) => {
          win.showCreate = true
        })

        for (let i = 0; i < dataframes.length; i++) {
          cy.allDone({timeout: 30000})
          const dataframe = dataframes[i];
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

      let payloads = operation.test.payloads

      let columns = payloads ? payloads[0].columns : false;

      let columnElements = columns ? columns.map(column => `#bb-table-${column} > .column-header-cell`) : [`.bb-table-h-cell:first-child`]

      for (let i = 0; i < columnElements.length; i++) {
        const columnElement = columnElements[i];
        cy.wait(300)
        cy.get(columnElement, { timeout: 20000 })
          .click({ctrlKey: true})
      }

      cy.wait(100)

      /* screenshot location */

      let toolbarItem = operation.group ? `#menu-${operation.group} > .icon-btn` : `#btn-${operation.command} > .icon-btn`
      let menuItem = operation.group ? `#menu-item-${operation.command}` : false

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

      cy.wait(1000)

      cy.screenshot(`locations/${operation.command}`, { capture: 'viewport' })

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

      let commandHandler = commandsHandlers[operation.command]

      if (commandHandler && commandHandler.dialog && commandHandler.dialog.fields) {

        for (let i = 0; i < payloads.length; i++) {

          const payload = payloads[i];

          for (const key in payload) {
            if (Object.hasOwnProperty.call(payload, key) && key !== 'columns') {
              let value = payload[key];
              if (key === 'output_cols') {
                for (let j = 0; j < value.length; j++) {
                  cy.fieldField(`output-col-${j}`, value[j])
                }
              } else {
                let field = commandHandler.dialog.fields.find((field) => field.key === key);
                cy[`${field.type}Field`](key, value, field);
              }
            }
          }

          cy.wait(1000)

          cy.get('#operation-form')
            .invoke('css', { 'height': 'auto', 'padding-bottom': '18px' })
            .screenshot(`forms/${operation.command}-${i}`)

          cy.get('.bumblebee-table-container')
            .then(($el) => {
              let $0 = $el.get(0)
              $0.classList.add('--minimal-table')
            })
          cy.get('.bbt-container')
            .screenshot(`tables/${operation.command}-${i}`)
          cy.get('.bumblebee-table-container')
            .then(($el) => {
              let $0 = $el.get(0)
              $0.classList.remove('--minimal-table')
            })

          cy.get('#btn-command-submit')
            .click()

          cy.allDone({timeout: 30000})

        }
      }

    })

  })

})
