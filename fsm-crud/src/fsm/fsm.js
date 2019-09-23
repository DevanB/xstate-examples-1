export const fsm = {
	id: 'Root',

	context: {
		items: [],
		selectedItemId: null,
		opFrom: null, // master|details
		modalData: null,
	},

	type: 'parallel',

	states: {

		//
		main: {

			invoke: [
				{
					id: 'ItemService',
					src: 'itemService',
				},
			],

			// Root.main
			on: {
				ITEM_NEW: [
					{
						target: ['#Root.main.newItem'],
						actions: ['createItem'],
					},
				],
				ITEM_EDIT: [
					{
						target: ['#Root.main.editItem'],
						actions: ['editItem'],
					},
				],
				ITEM_DELETE: [
					{
						target: ['#Root.main.master'],
						cond: (_, e) => e.from === 'master',
						actions: ['deleteItem'],
					},
					{
						target: ['#Root.main.details'],
						cond: (_, e) => e.from === 'details',
						actions: ['deleteItem'],
					},
				],

				// optimistic result - delete item
				OPTIMISTIC_DELETE_ITEM_SUCCESS: [
					{
						target: ['#Root.main.master', '#Root.global.selection.unSelected'],
						actions: 'deleteOptimisticItemSuccess',
					},
				],
				OPTIMISTIC_DELETE_ITEM_FAIL: [
					{
						target: ['#Root.main.master', '#Root.global.selection.selected'],
						actions: 'restoreOptimisticDeleteItem',
					},
				],

				// optimistic result - create item
				OPTIMISTIC_CREATE_ITEM_SUCCESS: [
					{
						target: ['#Root.main.master'],
						actions: 'createOptimisticItemSuccess',
					},
				],
				OPTIMISTIC_CREATE_ITEM_FAIL: [
					{
						target: ['#Root.main.master'],
						actions: 'restoreOptimisticNewItem',
					},
				],

				// optimistic result - edit item
				OPTIMISTIC_EDIT_ITEM_SUCCESS: [
					{
						target: ['#Root.main.master'],
						actions: 'editOptimisticItemSuccess',
					},
				],
				OPTIMISTIC_EDIT_ITEM_FAIL: [
					{
						target: ['#Root.main.master'],
						actions: 'restoreOptimisticEditItem',
					},
				],

// xxxx -> 
				// +TBD: 這段目前被迫在 master|details 各貼一次，無法移上來到 main 這層放一次磺好
				// 主要是 confirm 要對 ItemService 送事件時失敗
				// 錯誤為：Unable to send event to child 'ItemService' from service 'Root'.
				MODAL_ITEM_DELETE_CONFIRM: [
					{
						target: ['#Root.main.master'],
						actions: ['modalReset', 'localDeleteItem', 'remoteDeleteItem'],
					},
				],
				MODAL_ITEM_DELETE_CANCEL: [
					{
						target: ['#Root.main.master'],
						cond: 'backToMaster',
						actions: ['modalReset'],
					},
					{
						target: ['#Root.main.details'],
						cond: 'backToDetails',
						actions: ['modalReset'],
					},
				],
			},

			states: {

				//
				loading: {
					entry: [
						{
							type: 'reloadItems',
						},
					],
					on: {
						LOAD_ITEM_FAIL: [
							{
								actions: ['listDataError'],
								target: ['#Root.main.loadFailed'],
							},
						],
						LOAD_ITEM_SUCCESS: [
							{
								actions: ['listDataSuccess'],
								target: ['#Root.main.master'],
							},
						],
					},
					states: {},
				},

				//
				loadFailed: {
					on: {
						MODAL_ERROR_CLOSE: [
							{
								target: ['#Root.main.master'],
								actions: ['modalReset'],
							},
						],
						MODAL_ERROR_RETRY: [
							{
								actions: ['modalReset'],
								target: ['#Root.main.loading'],
							},
						],
					},
					states: {},
				},

				//
				master: {
					on: {
						ITEM_RELOAD: [
							{
								target: ['#Root.main.loading'],
								actions: [],
							},
						],
						ITEM_DETAILS: [
							{
								target: ['#Root.main.details'],
								actions: [],
							},
						],

						// MODAL_ITEM_DELETE_CONFIRM: [
						// 	{
						// 		target: ['#Root.main.master'],
						// 		actions: ['modalReset', 'localDeleteItem', 'remoteDeleteItem'],
						// 	},
						// ],
						// MODAL_ITEM_DELETE_CANCEL: [
						// 	{
						// 		target: ['#Root.main.master'],
						// 		cond: 'backToMaster',
						// 		actions: ['modalReset'],
						// 	},
						// 	{
						// 		target: ['#Root.main.details'],
						// 		cond: 'backToDetails',
						// 		actions: ['modalReset'],
						// 	},
						// ],


					},
				},

				//
				details: {
					on: {
						ITEM_BACK: [
							{
								actions: [],
								target: ['#Root.main.master'],
							},
						],
						// MODAL_ITEM_DELETE_CONFIRM: [
						// 	{
						// 		target: ['#Root.main.master'],
						// 		actions: ['modalReset', 'localDeleteItem', 'remoteDeleteItem'],
						// 	},
						// ],
						// MODAL_ITEM_DELETE_CANCEL: [
						// 	{
						// 		target: ['#Root.main.master'],
						// 		cond: 'backToMaster',
						// 		actions: ['modalReset'],
						// 	},
						// 	{
						// 		target: ['#Root.main.details'],
						// 		cond: 'backToDetails',
						// 		actions: ['modalReset'],
						// 	},
						// ],
					},
				},

				//
				newItem: {
					on: {
						NEW_ITEM_CANCEL: [
							{
								actions: [],
								cond: 'backToMaster',
								target: ['#Root.main.master'],
							},
							{
								target: ['#Root.main.details'],
								actions: [],
								cond: 'backToDetails',
							},
						],
						NEW_ITEM_SUBMIT: [
							{
								target: ['#Root.main.master'],
								actions: ['localCreateNewItem', 'remoteCreateNewItem'],
							},
						],
					},
				},

				//
				editItem: {
					on: {
						ITEM_EDIT_CANCEL: [
							{
								actions: [],
								cond: 'backToMaster',
								target: ['#Root.main.master'],
							},
							{
								target: ['#Root.main.details'],
								actions: [],
								cond: 'backToDetails',
							},
						],
						ITEM_EDIT_SUBMIT: [
							{
								target: ['#Root.main.master'],
								actions: ['localEditItem', 'remoteEditItem'],
							},
						],
					},
				},
			},
			initial: 'loading',
		},

		global: {

			type: 'parallel',

			states: {
				//
				selection: {
					initial: 'unSelected',
					states: {
						selected: {},
						unSelected: {},
					},
					on: {
						ITEM_SELECT: {
							target: '.selected',
							actions: 'selectItem',
						},
					},
				},
			},
		},
	},
	on: {},
}
