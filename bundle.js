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

  const defaults$1 = { ...config };

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

  function getTable (table) {
    if (table instanceof HTMLElement) {
      return table
    }
    if (typeof table === 'string') {
      return document.querySelector(table)
    }

    return null
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

  function onFileChange (field, callback) {
    const $field = getField(field);
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

  const defaults$2 = { ...config };

  function addRequired (field, params = {}) {
    params = {
      ...defaults$2,
      ...params
    };

    const $fields = getField(field, { returnArray: true });

    $fields.forEach(field => {
      field.setAttribute('required', 'S');
      field.removeAttribute('data-was-required');
    });

    if (params.container === 'tr') {
      const $container = $fields[0].closest(params.container);
      $container.classList.add(params.requiredClass);
    }
  }

  function removeRequired (field, params = {}) {
    params = {
      ...defaults$2,
      ...params
    };

    const $fields = getField(field, { returnArray: true });

    $fields.forEach(field => {
      field.setAttribute('required', 'N');
      field.setAttribute('data-was-required', true);
    });

    if (params.container === 'tr') {
      const $container = $fields[0].closest(params.container);
      $container.classList.remove(params.requiredClass);
    }
  }

  const defaults$3 = { ...config };

  function showField (field, params = {}) {
    params = {
      ...defaults$3,
      ...params
    };

    const $fields = getField(field, { returnArray: true });
    const $container = $fields[0].closest(params.container);
    const isRequired = hasFieldRequired($fields);

    $container.classList.remove(params.hideClass);

    if (isRequired) {
      addRequired($fields, params);
    }
  }

  function hideField (field, params = {}) {
    params = {
      ...defaults$3,
      ...params
    };

    const $fields = getField(field, { returnArray: true });
    const $container = $fields[0].closest(params.container);
    const isRequired = hasFieldRequired($fields);

    $container.classList.add(params.hideClass);

    clearFieldValues($fields);

    if (isRequired) {
      removeRequired($fields, params);
    }
  }

  function showTable (table) {
    const $table = getTable(table);
    const $fields = $table.querySelectorAll('[xname]');

    $fields.forEach(field => showField(field));
    $table.classList.remove(defaults$3.hideClass);
  }

  function hideTable (table) {
    const $table = getTable(table);
    const $fields = $table.querySelectorAll('[xname]');

    $fields.forEach(field => hideField(field));
    $table.classList.add(defaults$3.hideClass);
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
        ? showField(field)
        : hideField(field)
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
    function mount () {
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
        ? addRequired($refs.nr10Authorization)
        : removeRequired($refs.nr10Authorization)
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
    const $refs = {
      table: document.querySelector('#tbl-doumentos-saude')
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

  // import RequestTable from './request-table'

  const DocumentsTable = function () {
    const $refs = {
      generalDocsTable: document.querySelector('#tbl-doumentos-gerais'),
      securityDocsTable: document.querySelector('#tbl-doumentos-seguranca'),
      healthDocsTable: document.querySelector('#tbl-doumentos-saude')
    };

    const state = {
      alias: null,
      analysisColumnsRef: '[data-analysis]',
      mountOn: [
        'requisicao',
        'analise',
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

      // $refs.tables = getTables()
      // const $tables = Object.values($refs.tables)

      // if (alias === 'requisicao') {
      //   return $tables
      //     .forEach(table => RequestTable().mount({ ...table, ...options }))
      // }
      // if (alias === 'analise') {
      //   return $tables
      //     .forEach(table => AnalysisTable().mount({ ...table, ...options }))
      // }
      // if (alias === 'correcao') {
      //   // mountTableAdjustments()
      // }

      if (hasToMount) {
        mount();
      }
    }

    /**
     * 🔒 Private Methods
     */
    function mount () {
      const { alias } = state;

      DocumentsGeneral$1.mount();
      DocumentsSecurity$1.mount();
      DocumentsHealth$1.mount();

      if (alias === 'requisicao') {
        [
          $refs.generalDocsTable,
          $refs.securityDocsTable,
          $refs.healthDocsTable
        ].forEach(hideAnalysisColumns);
      }
    }

    function hideAnalysisColumns (table) {
      table
        .querySelectorAll(state.analysisColumnsRef)
        .forEach(col => col.classList.add('u-hidden'));
    }

    // function getTables () {
    //   return {
    //     generalDocsTable: {
    //       table: document.querySelector('#tbl-doumentos-gerais'),
    //       hasAnalysis: document.querySelector('[xname=inpanaliseGeral]')
    //     },
    //     healthDocsTable: {
    //       table: document.querySelector('#tbl-doumentos-saude'),
    //       hasAnalysis: document.querySelector('[xname=inpanaliseSaude]')
    //     },
    //     securityDocsTable: {
    //       table: document.querySelector('#tbl-doumentos-seguranca'),
    //       hasAnalysis: document.querySelector('[xname=inpanaliseSeguranca]')
    //     }
    //   }
    // }
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
        ? showField($refs.linkedCompany, FormUtilConfig)
        : hideField($refs.linkedCompany, FormUtilConfig)
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
      linkedCompany: document.querySelector('[xname=inpempresaVinculadaRazaoSocial]')
    };

    return {
      mount
    }

    /**
     * 🔑 Public Methods
     */
    function mount () {
      handleCompany(
        $refs.contractingCompany.value,
        $refs.contractingCompanyCard
      );

      handleCompany(
        $refs.linkedCompany.value,
        $refs.linkedCompanyCard
      );

      addTriggers();
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
  };

  var RequestCompany$1 = RequestCompany();

  const FormUtilConfig$1 = {
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
        .forEach(fieldId => showField(fieldId, FormUtilConfig$1));

      fields.native
        .forEach(fieldId => hideField(fieldId, FormUtilConfig$1));
    }

    function showNativeForm () {
      fields.native
        .forEach(fieldId => showField(fieldId, FormUtilConfig$1));

      fields.foreign
        .forEach(fieldId => hideField(fieldId, FormUtilConfig$1));

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
        'requisicao'
        // ,
        // 'analise',
        // 'correcao'
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

      RequestContract$1.mount();
      RequestCompany$1.mount();
      RequestEmployee$1.mount();

      /**
       * @todo
       * - criar fn request company somente leitura
       * - criar card de colaborador qnd somente leitura, avaliar uso de tabs qnd somente leitura
       * - criar componente para validação de form, bloquei do botão, validação do cpf...
       * - criar componente de tooltip
       * - ajustar fonte de dados de nacionalidade e preencher como brasileiro quando nativo
       * - realizar chamda a fonte para validar duplicidade de cadastro via cpf
       * - ver outras chamadas SQL que são usadas no Lecom
       * - colunas descricaoPedido (DESCON) e centroDeCusto (CA_CCUSTO_FORMATADO) não estão sendo utilizadas, remover?
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
