/* page */

Cypress.Commands.add('kernelDone', (options) => {
  cy.window().its('$nuxt.$store.state.kernel',options).should('equal','done')
})

Cypress.Commands.add('promisesDone', (options) => {
  cy.window().its('promises',options).should('be.empty')
})

Cypress.Commands.add('allDone', (options) => {
  cy.wait(100)
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

/* overwrites */

Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  originalFn(url, options)
    cy.get('#intercom-frame', { timeout: 20000 })
    .then(($el) => {
      let $0 = $el.get(0)
      $0.parentElement.removeChild($0)
    })
})

