'use strict';

/**
 * 👀 Form Info
 */

function getTaskAlias () {
  const taskAlias = document.querySelector('#inpDsFlowElementAlias');

  return taskAlias
    ? taskAlias.value
    : null
}

function ComponentError ({ message, name, type }) {
  this.name = name || 'ComponentError';
  this.message = message;
  this.type = type;
  this.stack = (new Error()).stack;

  this.codflowExecute = getElementValueById('inpCodFlowExecute');
  this.codflow = getElementValueById('inpCodFlow');
}

ComponentError.prototype = new Error();

const getElementValueById = id => {
  const $el = document.getElementById(id);

  return $el
    ? $el.value
    : null
};

const currencyFormatter = new Intl.NumberFormat(
  'pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

function cnpj (value) {
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

function titleCase (value) {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}

function empty (value) {
  if (value === null || value === '') {
    return '-'
  }
  return value
}

function hour (value) {
  if (value === null || value === '') {
    return '-'
  }

  return isNaN(value)
    ? value
    : `${value}h`
}

function currency (number) {
  const num = parseFloat(number) || 0;

  if (num === 0) {
    return '-'
  }

  return currencyFormatter.format(
    parseFloat(number) || 0
  )
}

var DefaultFilters = {
  cnpj,
  titleCase,
  empty,
  hour,
  currency
};

const defaults = {
  ref: '[data-bind]',
  filterRef: '[data-filter]',
  filters: DefaultFilters
};

const SUPPORTED_TYPE_FIELDS = [
  'text',
  'textarea',
  'select-one',
  'hidden',
  'radio'
];

function Binder (params) {
  const config = params = {
    ...defaults,
    ...params,
    name: 'Binder'
  };

  const CustomFilters = params.filters || {};

  config.filters = {
    ...DefaultFilters,
    ...CustomFilters
  };

  const elements = document.querySelectorAll(config.ref);

  const instance = {
    elements,
    update,
    updateAll
  };

  elements.forEach(mount);

  return instance

  /**
   * 🔒 Private Methods
   */
  function mount (element) {
    const { id, filter, fields } = getRefs(element);

    if (!fields.length) {
      throw new ComponentError({
        name: config.name,
        message:
        `Erro ao montar componente.\nNenhum campo do Orquestra encontrado para a referência ${id}`,
        type: 'field_not_found'
      })
    }

    const mask = fields[0].getAttribute('mask');
    const events = mask !== ''
      ? 'blur change keyup keydown'
      : 'change keyup';

    // Attention: using jQuery to react for changes in `sugestão` and `data`
    // (bootstrap-datepicker) Orquestra fields.
    // Those fields don't trigger native `change` events. 😞

    fields.forEach(field => {
      const isSupported = SUPPORTED_TYPE_FIELDS
        .includes(field.type);

      if (!isSupported) {
        return
      }

      setValue({ element, field, filter, id });

      $(field).on(events, () => {
        setValue({ element, field, filter, id });
      });
    });
  }

  function getRefs (element) {
    const id = element.getAttribute(
      stripeRefName(config.ref)
    );

    const filter = element.getAttribute(
      stripeRefName(config.filterRef)
    );

    const fields = document.querySelectorAll(`[xname=inp${id}]`);

    return {
      id,
      filter,
      fields
    }
  }

  function setValue ({ element, field, filter, id }) {
    const type = field.type;
    const fieldText = document.querySelector(`div[xid=div${id}]`);
    const hasFilter = filter && config.filters[filter];

    if (type === 'radio' && !field.checked) {
      return
    }

    const value = hasFilter
      ? config.filters[filter](field.value)
      : field.type !== 'hidden'
        ? field.value
        : fieldText.textContent;

    element.innerHTML = value;
  }

  /**
   * 🔑 Public Methods
   */
  function update (element) {
    const { filter, fields } = getRefs(element);

    if (!fields) {
      return
    }

    setValue({ element, fields, filter });
  }

  function updateAll () {
    instance.elements
      .forEach(element => {
        const { filter, field } = getRefs(element);
        setValue({ element, field, filter });
      });
  }
}

const stripeRefName = propSelector =>
  propSelector.substring(1, propSelector.length - 1);

const defaults$1 = {
  container: 'tr',
  hideClass: 'hidden',
  dataAttrRequired: 'data-was-required',
  requiredClass: 'execute-required'
};

/**
 * 💡 Helpers
 */

function getFieldById (fieldId, options) {
  options = {
    returnArray: false,
    ...options
  };

  const fields = document.querySelectorAll(`[xname="inp${fieldId}"]`);

  if (options.returnArray) {
    return [...fields]
  }

  return fields.length > 1
    ? [...fields]
    : fields[0]
}

function clearFileField (field) {
  const id = field.getAttribute('xname').substring(3);
  const deleteBtn = field.parentElement
    .querySelector(`#div${id} > a:last-of-type`);

  if (deleteBtn) {
    deleteBtn.click();
  }
}

function hasFieldRequired (fields) {
  return fields.filter(
    field =>
      field.getAttribute(defaults$1.dataAttrRequired) ||
      field.getAttribute('required') === 'S'
  ).length > 0
}

/**
 * 🧷 Form Utils
 */

function getField (field, options) {
  options = {
    returnArray: false,
    ...options
  };

  if (field instanceof HTMLElement) {
    return options.returnArray
      ? [field]
      : field
  }

  if (
    field instanceof HTMLCollection ||
    field instanceof NodeList ||
    Array.isArray(field)
  ) {
    return [...field]
  }

  if (typeof field === 'string') {
    return getFieldById(field, options)
  }
}

function clearFieldValues (field) {
  const $fields = getField(field, { returnArray: true });
  const changeEvent = new Event('change');

  $fields.forEach(field => {
    const fieldType = field.type;
    const xType = field.getAttribute('xtype');

    if (['text', 'textarea', 'select-one', 'hidden'].includes(fieldType)) {
      if (xType === 'FILE') {
        clearFileField(field);
      } else {
        field.value = '';
      }
    } else {
      field.checked = false;
    }

    field.dispatchEvent(changeEvent);
  });
}

function showField (field, container = defaults$1.container) {
  const $fields = getField(field, { returnArray: true });
  const $container = $fields[0].closest(container);
  const isRequired = hasFieldRequired($fields);

  $container.classList.remove(defaults$1.hideClass);

  if (isRequired) {
    addRequired($fields, true);
  }
}

function hideField (field, container = defaults$1.container) {
  const $fields = getField(field, { returnArray: true });
  const $container = $fields[0].closest(container);
  const isRequired = hasFieldRequired($fields);

  $container.classList.add(defaults$1.hideClass);

  clearFieldValues($fields);

  if (isRequired) {
    removeRequired($fields, true);
  }
}

/**
 * 📌 Form Required
 */

function addRequired (field, addClass = false) {
  const $fields = getField(field, { returnArray: true });

  $fields.forEach(field => {
    field.setAttribute('required', 'S');
    field.removeAttribute('data-was-required');
  });

  if (addClass && defaults$1.container === 'tr') {
    const $container = $fields[0].closest(defaults$1.container);
    $container.classList.add(defaults$1.requiredClass);
  }
}

function removeRequired (field, addClass = false) {
  const $fields = getField(field, { returnArray: true });

  $fields.forEach(field => {
    field.setAttribute('required', 'N');
    field.setAttribute('data-was-required', true);
  });

  if (addClass && defaults$1.container === 'tr') {
    const $container = $fields[0].closest(defaults$1.container);
    $container.classList.remove(defaults$1.requiredClass);
  }
}

const defaults$2 = {
  dataAttr: 'data-analysis',
  toggleMode: 'visibility',
  fieldPrefix: 'analise',
  approveButtons: ['#btnFinish', '#BtnSend'],
  reproveButtons: [],
  reproveOptions: []
};

function TableDocs (params) {
  params = {
    ...defaults$2,
    ...params
  };

  const approveButtons = [
    ...params.approveButtons
      .map(btnRef => document.querySelector(btnRef))
  ];

  const reproveButtons = [
    ...params.reproveButtons
      .map(btnRef => document.querySelector(btnRef))
  ];

  const analysisFields = [
    ...params.table
      .querySelectorAll(`[${params.dataAttr}]`)
  ]
    .filter(cell => cell.querySelector(`select[xname^=inp${params.fieldPrefix}]`))
    .map(cell => cell.querySelector(`select[xname^=inp${params.fieldPrefix}]`));

  const instance = {
    table: params.table,
    reproveOptions: params.reproveOptions,
    toggleMode: params.toggleMode,
    dataAttr: params.dataAttr,
    approveButtons,
    reproveButtons,
    analysisFields
  };

  addTriggers();
  renderTable();

  return instance

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    instance.analysisFields.forEach(field => {
      handleAnalysis();
      handleObservation(field);

      field.addEventListener('change', () => {
        handleAnalysis();
        handleObservation(field);
      });
    });
  }

  function renderTable () {
    params.table
      .querySelectorAll('tr')
      .forEach(row => {
        const fileInput = row.querySelector('td:nth-child(2) input[xtype=FILE]');
        const value = fileInput ? fileInput.value : null;

        if (value !== '') {
          return
        }

        row.style.display = 'none';
        row.querySelectorAll('[xname]')
          .forEach(field => field.setAttribute('required', 'N'));
      });

    params.table
      .querySelectorAll(`[${params.dataAttr}]`)
      .forEach(cell => {
        cell.style.display = 'table-cell';

        cell
          .querySelectorAll(`input[xname^=inp${params.fieldPrefix}][type=hidden][xtype=SELECT]`)
          .forEach(field => {
            const row = field.closest('tr');
            const hasRejection = instance.reproveOptions
              .includes(field.value);

            if (!hasRejection) {
              renderRowReadOnly(row);

              row.querySelector('button')
                .style
                .display = 'none';
            } else {
              row.classList.add('-error');
            }
          });
      });
  }

  function renderRowReadOnly (row) {
    const rowFields = row
      .querySelectorAll('select[xname], input[xname][type=text]:not([xtype=FILE])');

    rowFields.forEach(field => {
      const value = field.value;

      field.style.display = 'none';
      field.insertAdjacentHTML('afterend', `<span>${value}</span>`);
    });
  }

  function hasRejection () {
    return instance.analysisFields
      .some(select => instance.reproveOptions
        .includes(select.value)
      )
  }

  function handleAnalysis () {
    hasRejection()
      ? disabledConclude()
      : enableConclude();
  }

  function disabledConclude () {
    instance.approveButtons.forEach(btn => {
      if (btn) {
        btn.disabled = true;
      }
    });

    instance.reproveButtons.forEach(btn => {
      if (btn) {
        btn.disabled = false;
      }
    });
  }

  function enableConclude () {
    instance.approveButtons.forEach(btn => {
      if (btn) {
        btn.disabled = false;
      }
    });

    instance.reproveButtons.forEach(btn => {
      if (btn) {
        btn.disabled = true;
      }
    });
  }

  function handleObservation (analysis) {
    const observation = analysis.closest('tr')
      .querySelector('textarea');

    const hasObservation = params.reproveOptions
      .includes(analysis.value);

    if (instance.toggleMode === 'required') {
      return hasObservation
        ? addRequired(observation)
        : removeRequired(observation)
    }

    if (instance.toggleMode === 'visibility') {
      return hasObservation
        ? showField(observation, '.form-group')
        : hideField(observation, '.form-group')
    }
  }
}

var config = {
  container: 'tr',
  hideClass: 'u-hidden',
  dataAttrRequired: 'data-was-required',
  requiredClass: 'execute-required'
};

const defaults$3 = { ...config };

function getFieldById$1 (fieldId, options) {
  options = {
    returnArray: false,
    ...options
  };

  const fields = document.querySelectorAll(`[xname="inp${fieldId}"]`);

  if (options.returnArray) {
    return [...fields]
  }

  return fields.length > 1
    ? [...fields]
    : fields[0]
}

function getField$1 (field, options) {
  options = {
    returnArray: false,
    ...options
  };

  if (field instanceof HTMLElement) {
    return options.returnArray
      ? [field]
      : field
  }

  if (
    field instanceof HTMLCollection ||
    field instanceof NodeList ||
    Array.isArray(field)
  ) {
    return [...field]
  }

  if (typeof field === 'string') {
    return getFieldById$1(field, options)
  }
}

function getTable (table) {
  if (table instanceof HTMLElement) {
    return table
  }
  if (typeof table === 'string') {
    return document.querySelector(table)
  }

  return null
}

function clearFieldValues$1 (field) {
  const $fields = getField$1(field, { returnArray: true });
  const changeEvent = new Event('change');

  $fields.forEach(field => {
    const fieldType = field.type;
    const xType = field.getAttribute('xtype');

    if (['text', 'textarea', 'select-one', 'hidden'].includes(fieldType)) {
      if (xType === 'FILE') {
        clearFileField$1(field);
      } else {
        field.value = '';
      }
    } else {
      field.checked = false;
    }

    field.dispatchEvent(changeEvent);
  });
}

function clearFileField$1 (field) {
  const id = field.getAttribute('xname').substring(3);
  const deleteBtn = field.parentElement
    .querySelector(`#div${id} > a:last-of-type`);

  if (deleteBtn) {
    deleteBtn.click();
  }
}

function hasFieldRequired$1 (fields) {
  return fields.filter(
    field =>
      field.getAttribute(defaults$3.dataAttrRequired) ||
      field.getAttribute('required') === 'S'
  ).length > 0
}

function onFileChange (field, callback) {
  const $field = getField$1(field);
  const xType = field.getAttribute('xtype');

  if (xType !== 'FILE') {
    return
  }

  const observer = new MutationObserver(handleFileChange);

  observer.observe($field, { attributes: true });

  function handleFileChange (mutationsList, observer) {
    mutationsList.forEach(mutation => {
      if (mutation.type === 'attributes') {
        const id = $field.getAttribute('xname')
          .substring(3);

        const attachment = field.parentElement
          .querySelector(`#div${id} > a`);

        const deleteBtn = field.parentElement
          .querySelector(`#div${id} > a:last-of-type`);

        const filepath = attachment
          ? attachment.href
          : null;

        if (deleteBtn) {
          deleteBtn.addEventListener(
            'click',
            () => callback(null)
          );
        }

        callback(filepath, deleteBtn);
      }
    });
  }
}

const defaults$4 = { ...config };

function addRequired$1 (field, params = {}) {
  params = {
    ...defaults$4,
    ...params
  };

  const $fields = getField$1(field, { returnArray: true });

  $fields.forEach(field => {
    field.setAttribute('required', 'S');
    field.removeAttribute('data-was-required');
  });

  if (params.container === 'tr') {
    const $container = $fields[0].closest(params.container);
    $container.classList.add(params.requiredClass);
  }
}

function removeRequired$1 (field, params = {}) {
  params = {
    ...defaults$4,
    ...params
  };

  const $fields = getField$1(field, { returnArray: true });

  $fields.forEach(field => {
    field.setAttribute('required', 'N');
    field.setAttribute('data-was-required', true);
  });

  if (params.container === 'tr') {
    const $container = $fields[0].closest(params.container);
    $container.classList.remove(params.requiredClass);
  }
}

const defaults$5 = { ...config };

function showField$1 (field, params = {}) {
  params = {
    ...defaults$5,
    ...params
  };

  const $fields = getField$1(field, { returnArray: true });
  const $container = $fields[0].closest(params.container);
  const isRequired = hasFieldRequired$1($fields);

  $container.classList.remove(params.hideClass);

  if (isRequired) {
    addRequired$1($fields, params);
  }
}

function hideField$1 (field, params = {}) {
  params = {
    ...defaults$5,
    ...params
  };

  const $fields = getField$1(field, { returnArray: true });
  const $container = $fields[0].closest(params.container);
  const isRequired = hasFieldRequired$1($fields);

  $container.classList.add(params.hideClass);

  clearFieldValues$1($fields);

  if (isRequired) {
    removeRequired$1($fields, params);
  }
}

function showTable (table) {
  const $table = getTable(table);
  const $fields = $table.querySelectorAll('[xname]');

  $fields.forEach(field => showField$1(field));
  $table.classList.remove(defaults$5.hideClass);
}

function hideTable (table) {
  const $table = getTable(table);
  const $fields = $table.querySelectorAll('[xname]');

  $fields.forEach(field => hideField$1(field));
  $table.classList.add(defaults$5.hideClass);
}

const GeneralFilesConfig = [{
  field: 'anexo_Identidade',
  visibleAt: 'always'
}, {
  field: 'anexo_CopiaVisto',
  visibleAt: ['Estrangeiro']
}, {
  field: 'anexo_ContratoEstrangeiro',
  visibleAt: ['Estrangeiro']
}, {
  field: 'anexo_DeclaracaoResponsabilidade',
  visibleAt: ['Estrangeiro']
}, {
  field: 'anexo_SegVidaESaude',
  visibleAt: ['Estrangeiro']
}, {
  field: 'anexo_CopiaPassagemRetorno',
  visibleAt: ['Estrangeiro']
}, {
  field: 'anexo_Cpts',
  visibleAt: ['Empregado/CLT', 'Temporário']
}, {
  field: 'anexo_Contrato',
  visibleAt: ['Empregado/CLT', 'Temporário']
}, {
  field: 'anexo_contratoSocial',
  visibleAt: ['PJ']
}];

const DocumentsGeneral = function () {
  const $refs = {
    table: document.querySelector('#tbl-doumentos-gerais'),
    contractType: document.querySelector('[xname=inptipoDeContrato]')
  };

  return {
    mount
  }

  /**
   * 🔑 Public Methods
   */
  function mount () {
    addTriggers();
    setTableVisibility($refs.contractType.value);
  }

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    $refs.contractType
      .addEventListener(
        'change',
        () => setTableVisibility($refs.contractType.value)
      );
  }

  function setTableVisibility (contract) {
    if (contract !== '') {
      showTable($refs.table);
    } else {
      hideTable($refs.table);
    }

    return GeneralFilesConfig
      .forEach(doc => setDocVisibility(doc, contract))
  }

  function setDocVisibility ({ field, visibleAt }, contract) {
    const showDocument =
      visibleAt.includes(contract) || visibleAt === 'always';

    return showDocument
      ? showField$1(field)
      : hideField$1(field)
  }
};

var DocumentsGeneral$1 = DocumentsGeneral();

const DocumentsSecurity = function () {
  const $refs = {
    nr10: document.querySelector('[xname=inpanexo_Nr10]'),
    nr10Authorization: document.querySelector('[xname=inpanexo_Nr10CartaAutorizacao]')
  };

  return {
    mount
  }

  /**
   * 🔑 Public Methods
   */
  function mount () {
    addTriggers();
  }

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    onFileChange($refs.nr10, onNr10Change);
  }

  function onNr10Change (filepath) {
    return filepath
      ? addRequired$1($refs.nr10Authorization)
      : removeRequired$1($refs.nr10Authorization)
  }
};

var DocumentsSecurity$1 = DocumentsSecurity();

const DocumentsTable = function () {
  const $refs = {
    generalDocsTable: document.querySelector('#tbl-doumentos-gerais'),
    securityDocsTable: document.querySelector('#tbl-doumentos-seguranca'),
    healthDocsTable: document.querySelector('#tbl-doumentos-saude')
  };

  const tablesConfig = [
    {
      table: $refs.generalDocsTable,
      alias: 'analise-geral'
    },
    {
      table: $refs.securityDocsTable,
      alias: 'analise-seguranca'
    },
    {
      table: $refs.healthDocsTable,
      alias: 'analise-saude'
    }
  ];

  const state = {
    alias: null,
    analysisColumnsRef: '[data-analysis]',
    mountOn: [
      'requisicao',
      'correcao',
      'analise-geral',
      'analise-seguranca',
      'analise-saude'
    ]
  };

  return {
    init
  }

  /**
   * 🔑 Public Methods
   */
  function init ({ alias }) {
    const hasToMount = state.mountOn
      .includes(alias);

    state.alias = alias;

    if (hasToMount) {
      mount();
    }
  }

  /**
   * 🔒 Private Methods
   */
  function mount () {
    const { alias } = state;

    if (alias === 'requisicao') {
      DocumentsGeneral$1.mount();
      DocumentsSecurity$1.mount();
    } else {
      tablesConfig.forEach(handleTables);
    }
  }

  function handleTables ({ table, alias }) {
    return [alias, 'correcao'].includes(state.alias)
      ? mountTable(table)
      : unmountTable(table)
  }

  function mountTable (table) {
    const approveButtons = state.alias !== 'analise-geral'
      ? ['#btnFinish']
      : ['#btnApprove', '#BtnReject'];

    TableDocs({
      table,
      approveButtons,
      reproveButtons: ['#customBtn_Pendências'],
      reproveOptions: ['Reprovado']
    });
  }

  function unmountTable (table) {
    table.classList.add('u-hidden');
  }
};

var DocumentsTables = DocumentsTable();

const FormUtilConfig = {
  container: '.form-group',
  hideClass: 'u-hidden'
};

const RequestContract = function () {
  const $refs = {
    employeeBond: document.querySelectorAll('[xname=inpvinculo]'),
    linkedCompany: document.querySelector('[xname=inpempresaVinculadaRazaoSocial]')
  };

  return {
    mount
  }

  /**
   * 🔑 Public Methods
   */
  function mount () {
    handleEmployeeBond();
    addTriggers();
  }

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    $refs.employeeBond
      .forEach(field =>
        field.addEventListener('change', handleEmployeeBond)
      );
  }

  function handleEmployeeBond () {
    const bond = getEmployeeBond();
    const hasLinkedBond =
      bond === 'Empresa subcontratada por outra empresa, diretamente contratada pela CMPC';

    return hasLinkedBond
      ? showField$1($refs.linkedCompany, FormUtilConfig)
      : hideField$1($refs.linkedCompany, FormUtilConfig)
  }

  function getEmployeeBond () {
    const bond = document.querySelector('[xname=inpvinculo]:checked');

    return bond
      ? bond.value
      : null
  }
};

var RequestContract$1 = RequestContract();

const RequestCompany = function () {
  const $refs = {
    contractingCompanyCard: document.querySelector('#company-card'),
    linkedCompanyCard: document.querySelector('#linked-company-card'),
    companyFieldsContainer: document.querySelector('#company-fields'),
    contractingCompany: document.querySelector('[xname=inpempresaRazaoSocial]'),
    contractingCompanyRequest: document.querySelector('[xname=inpempresaPedidoSap]'),
    linkedCompany: document.querySelector('[xname=inpempresaVinculadaRazaoSocial]')
  };

  const state = {
    contractingCompanyFields: [
      $refs.contractingCompany,
      $refs.contractingCompanyRequest
    ],
    linkedCompanyFields: [
      $refs.contractingCompany,
      $refs.contractingCompanyRequest,
      $refs.linkedCompany
    ]
  };

  return {
    mount
  }

  /**
   * 🔑 Public Methods
   */
  function mount ({ readonly }) {
    handleCompany(
      state.contractingCompanyFields,
      $refs.contractingCompanyCard
    );

    handleCompany(
      state.linkedCompanyFields,
      $refs.linkedCompanyCard
    );

    addTriggers();

    if (readonly) {
      hideFormFields();
    }
  }

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    state.contractingCompanyFields
      .forEach(field =>
        field.addEventListener('change', () =>
          handleCompany(
            state.contractingCompanyFields,
            $refs.contractingCompanyCard
          )
        )
      );

    state.linkedCompanyFields
      .forEach(field =>
        field.addEventListener('change', () =>
          handleCompany(
            state.linkedCompanyFields,
            $refs.linkedCompanyCard
          )
        )
      );
  }

  function handleCompany (deps, card) {
    return deps.some(field => field.value === '')
      ? hideCompanyCard(card)
      : showCompanyCard(card)
  }

  function showCompanyCard (card) {
    card.classList.remove('u-hidden');
  }

  function hideCompanyCard (card) {
    card.classList.add('u-hidden');
  }

  function hideFormFields () {
    $refs.companyFieldsContainer
      .classList.add('u-hidden');
  }
};

var RequestCompany$1 = RequestCompany();

const getControllerButtons = () =>
  document
    .querySelector('#controllers')
    .querySelectorAll('button.btn');

function disableConclude () {
  getControllerButtons()
    .forEach(btn => {
      btn.disabled = true;
    });
}

function enableConclude () {
  getControllerButtons()
    .forEach(btn => {
      btn.disabled = false;
    });
}

function isCpfValid (cpf, rejectList = []) {
  const stripped = strip(cpf);

  if (!stripped) {
    return false
  }

  if (stripped.length !== 11) {
    return false
  }

  if (/^(\d)\1{10}$/.test(stripped)) {
    return false
  }

  if (rejectList.includes(stripped)) {
    return false
  }

  let numbers = stripped.substr(0, 9);
  numbers += verifierDigit(numbers);
  numbers += verifierDigit(numbers);

  return numbers.substr(-2) === stripped.substr(-2)
}

function verifierDigit (numbers) {
  const numberList = numbers.split('')
    .map((number) => parseInt(number, 10));

  const modulus = numberList.length + 1;

  const multiplied = numberList.map(
    (number, index) => number * (modulus - index)
  );

  const mod = multiplied.reduce((buffer, number) => buffer + number) % 11;

  return mod < 2 ? 0 : 11 - mod
}

function strip (cpf) {
  return (cpf || '').toString().replace(/[.-]/g, '')
}

const ORQUESTRA_DATASOURCE_URL =
  'https://cmpc.orquestrabpm.com.br/api/internal/legacy/1.0/datasource/get/1.0' +
  '/qw0Xk6xWKL563BI8VvBqJk4y6mPjvrmxBQq6eoT8pt8ur8KUEZgwGJytjQ7dnXqMrz9lai2J91TCIoxPbrW8Mg__';

const validateCpfFromBlockList = function ({ cpf }) {
  const url = new URL(ORQUESTRA_DATASOURCE_URL);

  const params = {
    inpcpf: cpf.replace(/\D/g, '')
  };

  url.search = new URLSearchParams(params).toString();

  return fetch(url)
    .then(res => res.json())
    .then(({ success }) => {
      if (!success.length) {
        return false
      }

      return parseData(success[0])
    })
};

const parseData = ({ cod, fields }) => ({
  cpf: cod,
  blockType: getBlockType(fields.tipoBloqueio)
});

const getBlockType = type => {
  if (type === 'P') {
    return 'META_PENDENCIE'
  }

  if (type === 'B') {
    return 'BLOCKED_CPF'
  }

  return null
};

const FormUtilConfig$1 = {
  container: '.form-group',
  hideClass: 'u-hidden'
};

const RequestEmployee = function () {
  const BRAZILIAN_NATIONALITY_ID = 10;

  const $refs = {
    employeeCard: document.querySelector('#employee-card'),
    employeeFieldsContainer: document.querySelector('#employee-fields'),
    contractType: document.querySelector('[xname=inptipoDeContrato]'),
    cpf: document.querySelector('[xname=inpcolaboradorCpf]'),
    nationality: document.querySelector('[xname=inpcolaboradorNacionalidade]')
  };

  const fields = {
    defaults: [
      'colaboradorNome',
      'colaboradorSexo',
      'colaboradorDataNascimento',
      'colaboradorCargo'
    ],
    native: [
      'colaboradorCpf',
      'colaboradorCtps',
      'colaboradorCtpsSerie',
      'colaboradorCtpsExpedicao',
      'colaboradorCtpsUf',
      'colaboradorCtpsPis',
      'colaboradorCptsAdmissao'
    ],
    foreign: [
      'colaboradorRne',
      'colaboradorNacionalidade',
      'colaboradorDataChegadaBrasil',
      'colaboradorTipoVisto',
      'colaboradorVistoValidade'
    ]
  };

  const card = {
    native: [
      document.querySelector('#employee-card-cpf'),
      document.querySelector('#employee-card-startAt'),
      document.querySelector('#employee-card-native')
    ],
    foreign: [
      document.querySelector('#employee-card-rne'),
      document.querySelector('#employee-card-foreign')
    ]
  };

  const state = {
    static: false,
    readonly: false
  };

  return {
    mount
  }

  /**
   * 🔑 Public Methods
   */
  function mount ({ alias }) {
    const contractType = $refs.contractType.value;

    state.static = [
      'analise-geral',
      'analise-seguranca',
      'analise-saude',
      'correcao'
    ].includes(alias);

    state.readonly = [
      'analise-seguranca',
      'analise-saude',
      'correcao'
    ].includes(alias);

    if (state.readonly) {
      return setReadonly(contractType)
    }

    handleEmployeeFields(contractType);
    addTriggers();
  }

  /**
   * 🔒 Private Methods
   */
  function addTriggers () {
    $refs.contractType
      .addEventListener(
        'change',
        () => handleEmployeeFields($refs.contractType.value)
      );

    $refs.cpf
      .addEventListener(
        'change',
        () => validateCpf($refs.cpf.value)
      );
  }

  function setReadonly (contractType) {
    $refs.employeeFieldsContainer
      .classList.add('u-hidden');

    $refs.employeeCard
      .classList.remove('u-hidden');

    return contractType === 'Estrangeiro'
      ? mountForeignCard()
      : mountNativeCard()
  }

  function mountNativeCard () {
    card.foreign.forEach(el =>
      el.classList.add('u-hidden')
    );
  }

  function mountForeignCard () {
    card.native.forEach(el =>
      el.classList.add('u-hidden')
    );
  }

  function handleEmployeeFields (contractType) {
    return contractType === 'Estrangeiro'
      ? showForeignForm()
      : showNativeForm()
  }

  function showForeignForm () {
    fields.foreign
      .forEach(fieldId => showField$1(fieldId, FormUtilConfig$1));

    fields.native
      .forEach(fieldId => hideField$1(fieldId, FormUtilConfig$1));

    if (!state.static) {
      $refs.nationality.value = '';
    }
  }

  function showNativeForm () {
    fields.native
      .forEach(fieldId => showField$1(fieldId, FormUtilConfig$1));

    fields.foreign
      .forEach(fieldId => hideField$1(fieldId, FormUtilConfig$1));

    if (!state.static) {
      $refs.nationality.value = BRAZILIAN_NATIONALITY_ID;
    }
  }

  function validateCpf (cpf) {
    removeFieldHint($refs.cpf);

    if (cpf === '') {
      return
    }

    if (!isCpfValid(cpf)) {
      disableConclude();
      return addFieldHint(
        $refs.cpf,
        'O CPF informado não possui um formato válido',
        'error'
      )
    }

    addFieldLoading($refs.cpf);

    validateCpfFromBlockList({ cpf })
      .then(handleCpfBlockListResult)
      .catch(handleCpfBlockListError);
  }

  function handleCpfBlockListError (err) {
    removeFieldLoading($refs.cpf);
    console.error(err);
  }

  function handleCpfBlockListResult (block) {
    removeFieldLoading($refs.cpf);

    if (!block) {
      enableConclude();
      addFieldHint(
        $refs.cpf,
        'O CPF informado é válido!',
        'success'
      );
    } else {
      disableConclude();
      addFieldHint(
        $refs.cpf,
        getCpfErrorMessage(block.blockType),
        'error'
      );
    }
  }

  function getCpfErrorMessage (blockType) {
    if (blockType === 'META_PENDENCIE') {
      return 'O CPF informado tem pendências a tratar com a META'
    }

    if (blockType === 'BLOCKED_CPF') {
      return 'O CPF informado está bloqueado pela CMPC'
    }

    return 'O CPF informado não é permitido'
  }

  function addFieldLoading (field) {
    const wrapper = field.closest('.form-input');
    wrapper.classList.add('-loading');
  }

  function removeFieldLoading (field) {
    const wrapper = field.closest('.form-input');
    wrapper.classList.remove('-loading');
  }

  function addFieldHint (field, message, modifier) {
    const group = field.closest('.form-group');

    group.insertAdjacentHTML(
      'beforeend',
      `<span class="form-hint ${modifier ? '-' + modifier : ''}">${message}</span>`
    );
  }

  function removeFieldHint (field) {
    const group = field.closest('.form-group');
    const hint = group.querySelector('.form-hint');

    if (hint) {
      hint.remove();
    }
  }
};

var RequestEmployee$1 = RequestEmployee();

const RequestForm = function () {
  const state = {
    alias: null,
    mountOn: [
      'requisicao',
      'analise-geral',
      'analise-seguranca',
      'analise-saude',
      'correcao'
    ]
  };

  return {
    init
  }

  /**
   * 🔑 Public Methods
   */
  function init ({ alias }) {
    const hasToMount = state.mountOn
      .includes(alias);

    state.alias = alias;

    if (hasToMount) {
      mount();
    }
  }

  /**
   * 🔒 Private Methods
   */
  function mount () {
    const { alias } = state;
    const readonly = [
      'analise-geral',
      'analise-seguranca',
      'analise-saude',
      'correcao'
    ].includes(alias);

    if (alias === 'requisicao') {
      RequestContract$1.mount();
    }

    RequestCompany$1.mount({ readonly });
    RequestEmployee$1.mount({ alias });
  }
};

var RequestForm$1 = RequestForm();

/**
 * Components
 */

const alias = getTaskAlias();

/**
 * Global Components Initialization
 */
Binder();

/**
 * Modules Initialization
 */
RequestForm$1.init({ alias });
DocumentsTables.init({ alias });

/**
 * @todo temp fix Orquestra Error
 */
window.isInsideMultipleValueTable = btn => false;
//# sourceMappingURL=app.js.map
