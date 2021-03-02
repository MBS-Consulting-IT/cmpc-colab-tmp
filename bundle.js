(function () {
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

  const defaults$5 = {
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
      ...defaults$5,
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

        setValue({ element, field, filter });

        $(field).on(events, () => {
          setValue({ element, field, filter });
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

    function setValue ({ element, field, filter }) {
      const type = field.type;
      const hasFilter = filter && config.filters[filter];

      if (type === 'radio' && !field.checked) {
        return
      }

      const value = hasFilter
        ? config.filters[filter](field.value)
        : field.value;

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

  var config = {
    container: 'tr',
    hideClass: 'hidden',
    dataAttrRequired: 'data-was-required',
    requiredClass: 'execute-required'
  };

  const defaults$4 = { ...config };

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
        field.getAttribute(defaults$4.dataAttrRequired) ||
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

  const defaults$3 = { ...config };

  function addRequired$1 (field, params = {}) {
    params = {
      ...defaults$3,
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
      ...defaults$3,
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

  const defaults$2 = { ...config };

  function showField$1 (field, params = {}) {
    params = {
      ...defaults$2,
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
      ...defaults$2,
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
    $table.classList.remove(defaults$2.hideClass);
  }

  function hideTable (table) {
    const $table = getTable(table);
    const $fields = $table.querySelectorAll('[xname]');

    $fields.forEach(field => hideField$1(field));
    $table.classList.add(defaults$2.hideClass);
  }

  const GeneralFilesConfig = [{
    field: 'anexo_foto3x4',
    visibleAt: 'always'
  }, {
    field: 'anexo_documentoIdentificacao',
    visibleAt: 'always'
  }, {
    field: 'anexo_Ctps',
    visibleAt: ['Empregado/CLT', 'Remoto']
  }, {
    field: 'anexo_FichaRegistro',
    visibleAt: ['Empregado/CLT']
  }, {
    field: 'anexo_ContratoDeTrabalho',
    visibleAt: ['Empregado/CLT', 'Estagiário', 'Remoto']
  }, {
    field: 'anexo_ContratoSocialReqEmpresario',
    visibleAt: ['PJ']
  }, {
    field: 'anexo_ContratoEstrangeiro',
    visibleAt: ['Estrangeiro']
  }, {
    field: 'anexo_DeclaracaoDeResponsabilidade',
    visibleAt: ['Estrangeiro']
  }, {
    field: 'anexo_ComprovanteDeSeguroDeVidaESaude',
    visibleAt: ['Estrangeiro']
  }, {
    field: 'anexo_CopiaDaPassagemDeRetorno',
    visibleAt: ['Estrangeiro']
  }];

  const HealthFilesValidity = [{
    issue: document.querySelector('[xname=inpemissaoTestePcr]'),
    validity: document.querySelector('[xname=inpvalidadeTestePcr]')
  }, {
    issue: document.querySelector('[xname=inpemissaoProtocoloCovid]'),
    validity: document.querySelector('[xname=inpvalidadeProtocoloCovid]')
  }];

  const DocumentsGeneral = function () {
    const $refs = {
      table: document.querySelector('#tbl-doumentos-gerais'),
      picture: document.querySelector('[xname=inpanexo_foto3x4]'),
      contractType: document.querySelector('[xname=inptipoDeContrato]')
    };

    return {
      mount
    }

    /**
     * 🔑 Public Methods
     */
    function mount () {
      setTableVisibility($refs.contractType.value);
      addTriggers();
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

      onFileChange($refs.picture, validatePictureFormat);
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

    function validatePictureFormat (filepath, deleteBtn) {
      const validExtesions = ['jpg', 'png', 'bmp'];

      if (!filepath) {
        return
      }

      const fileExtension = filepath.split('.').pop();
      const hasValidExtension = validExtesions.includes(fileExtension);

      if (!hasValidExtension) {
        alert(
          `A extensão ${fileExtension} não é permitida. A foto 3x4 deve estar em um dos seguintes formatos:\n ${validExtesions.join(', ')}.`
        );

        deleteBtn.click();
      }
    }
  };

  var DocumentsGeneral$1 = DocumentsGeneral();

  const DocumentsSecurity = function () {
    const $refs = {
      table: document.querySelector('#tbl-doumentos-seguranca'),
      needBadge: document.querySelector('[xname=inpcolaboradorHabilitacoesCracha]'),
      nr10: document.querySelector('[xname=inpanexarNr10]'),
      nr10Authorization: document.querySelector('[xname=inpnr10CartaDeAutorizacao]')
    };

    return {
      mount
    }

    /**
     * 🔑 Public Methods
     */
    function mount ({ readonly }) {
      if (readonly) {
        return
      }

      handleSecurityDocs($refs.needBadge.checked);
      addTriggers();
    }

    /**
     * 🔒 Private Methods
     */
    function addTriggers () {
      $refs.needBadge
        .addEventListener(
          'change',
          () => handleSecurityDocs($refs.needBadge.checked)
        );

      onFileChange($refs.nr10, onNr10Change);
    }

    function handleSecurityDocs (needBadge) {
      return needBadge
        ? showTable($refs.table)
        : hideTable($refs.table)
    }

    function onNr10Change (filepath) {
      return filepath
        ? addRequired$1($refs.nr10Authorization)
        : removeRequired$1($refs.nr10Authorization)
    }
  };

  var DocumentsSecurity$1 = DocumentsSecurity();

  const addYears = (date, quantity) => {
    const newDate = new Date(date);
    newDate.setFullYear(date.getFullYear() + quantity);

    return newDate
  };

  const parseDate = stringDate => {
    const [dd, mm, yyyy] = stringDate.split('/');
    return new Date(yyyy, mm - 1, dd)
  };

  const formatDate = date =>
    date.toLocaleDateString('pt-BR', {});

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

  function formatCpf (cpf) {
    return strip(cpf)
      .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
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

  const DocumentsHealth = function () {
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
      HealthFilesValidity
        .forEach(({ issue, validity }) => {
          issue.addEventListener(
            'change',
            () => setDocValidity(issue, validity)
          );
        });
    }

    function setDocValidity (issue, validity) {
      if (issue.value === '') {
        validity.value = '';
        return
      }

      const issuedAt = parseDate(issue.value);
      const validUntil = addYears(issuedAt, 1);

      validity.value = formatDate(validUntil);
    }
  };

  var DocumentsHealth$1 = DocumentsHealth();

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

  const defaults = {
    dataAttr: 'data-analysis',
    toggleMode: 'visibility',
    fieldPrefix: 'analise',
    approveButtons: ['#btnFinish', '#BtnSend'],
    reproveButtons: [],
    reproveOptions: []
  };

  function TableDocs (params) {
    params = {
      ...defaults,
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
        .querySelectorAll(`[${params.dataAttr}]`)
        .forEach(cell => {
          cell.style.display = 'table-cell';

          cell
            .querySelectorAll(`input[xname^=inp${params.fieldPrefix}][type=hidden][xtype=SELECT]`)
            .forEach(field => {
              const hasRejection = instance.reproveOptions
                .includes(field.value);

              if (!hasRejection) {
                field
                  .closest('tr')
                  .querySelector('button')
                  .style.display = 'none';
              }
            });
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
          ? showField(observation, 'td')
          : hideField(observation, 'td')
      }
    }
  }

  // import RequestTable from './request-table'

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

      const readonly = [
        'analise-geral',
        'analise-seguranca',
        'analise-saude',
        'correcao'
      ].includes(alias);

      const tables = [
        $refs.generalDocsTable,
        $refs.securityDocsTable,
        $refs.healthDocsTable
      ];

      if (alias === 'requisicao') {
        tables.forEach(hideAnalysisColumns);
      } else {
        tablesConfig.forEach(config => {
          const approveButtons = alias !== 'analise-geral'
            ? ['#btnFinish']
            : ['#btnApprove', '#BtnReject'];

          config.alias !== alias
            ? hideTable(config.table)
            : TableDocs({
              table: config.table,
              approveButtons,
              reproveOptions: [
                'Aprovado com ressalva',
                'Reprovado'
              ],
              reproveButtons: [
                '#customBtn_Pendências'
              ]
            });
        });
      }

      DocumentsGeneral$1.mount();
      DocumentsSecurity$1.mount({ readonly });
      DocumentsHealth$1.mount();
    }

    function hideAnalysisColumns (table) {
      table
        .querySelectorAll(state.analysisColumnsRef)
        .forEach(col => col.classList.add('u-hidden'));
    }

    function hideTable (table) {
      table
        .classList.add('u-hidden');
    }
  };

  var DocumentsTables = DocumentsTable();

  const FormUtilConfig$1 = {
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
        ? showField$1($refs.linkedCompany, FormUtilConfig$1)
        : hideField$1($refs.linkedCompany, FormUtilConfig$1)
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
      contractingCompany: document.querySelector('[xname=inpempresaRazaoSocial]'),
      linkedCompany: document.querySelector('[xname=inpempresaVinculadaRazaoSocial]'),
      companyFieldsContainer: document.querySelector('#company-fields')
    };

    return {
      mount
    }

    /**
     * 🔑 Public Methods
     */
    function mount ({ readonly }) {
      handleCompany(
        $refs.contractingCompany.value,
        $refs.contractingCompanyCard
      );

      handleCompany(
        $refs.linkedCompany.value,
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
      $refs.contractingCompany
        .addEventListener('change', e =>
          handleCompany(e.target.value, $refs.contractingCompanyCard)
        );

      $refs.linkedCompany
        .addEventListener('change', e =>
          handleCompany(e.target.value, $refs.linkedCompanyCard)
        );
    }

    function handleCompany (company, card) {
      return company !== ''
        ? showCompanyCard(card)
        : hideCompanyCard(card)
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

  const FormUtilConfig = {
    container: '.form-group',
    hideClass: 'u-hidden'
  };

  const RequestEmployee = function () {
    const $refs = {
      contractType: document.querySelector('[xname=inptipoDeContrato]'),
      cpf: document.querySelector('[xname=inpcolaboradorCpf]')
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

    return {
      mount
    }

    /**
     * 🔑 Public Methods
     */
    function mount () {
      handleEmployeeFields($refs.contractType.value);
      validateCpf($refs.cpf.value);

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

    function handleEmployeeFields (type) {
      return type === 'Estrangeiro'
        ? showForeignForm()
        : showNativeForm()
    }

    function showForeignForm () {
      fields.foreign
        .forEach(fieldId => showField$1(fieldId, FormUtilConfig));

      fields.native
        .forEach(fieldId => hideField$1(fieldId, FormUtilConfig));
    }

    function showNativeForm () {
      fields.native
        .forEach(fieldId => showField$1(fieldId, FormUtilConfig));

      fields.foreign
        .forEach(fieldId => hideField$1(fieldId, FormUtilConfig));

      // @todo preencher como brasileiro no campo oculto
    }

    function validateCpf (cpf) {
      if (cpf === '') {
        return
      }

      if (!isCpfValid(cpf)) {
        return alert(`O CPF informado não possui um formato válido.\n${formatCpf(cpf)}`)
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
      RequestEmployee$1.mount();

      /**
       * @todo
       * - criar fonte para pesquisa do campo treinamento ETS: valores - Não encontrado / Encontrado
       * - criar fn request company somente leitura
       * - criar card de colaborador qnd somente leitura, avaliar uso de tabs qnd somente leitura
       * - criar componente de tooltip
       * - ajustar fonte de dados de nacionalidade e preencher como brasileiro quando nativo
       * - criar componente para validação de form, bloqueio do botão, validação do cpf...
       * - realizar chamda a fonte para validar duplicidade de cadastro via cpf
       *
       * @prioridade
       * - quando marcar o campo checkbox "inpcolaboradorHabilitacoesCracha" colocar o valor "sim" no campo "analiseSeguranca" (remover preenchimento automático da config.)
       * @next
       * - colunas descricaoPedido (DESCON) e centroDeCusto (CA_CCUSTO_FORMATADO) não estão sendo utilizadas. talvez incluir descrição no card da empresa
       */
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

  // @todo reportar erro a SML
  window.isInsideMultipleValueTable = btn => false;

}());
//# sourceMappingURL=bundle.js.map
