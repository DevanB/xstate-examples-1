/* eslint-disable */
import { randomId, random, getItemById } from '../utils/helpers'

// A Callback service
// cb() let's up dispatch event to the parent
// onReceive() allows us to receive events from the parent while the service is running
export const itemService = (ctx, e) => (cb, onReceive) => {
	let cnt = 0
	let cancelled = false
	let retries = 0

	onReceive(evt => {
		switch (evt.type) {

			// +TBD
			case 'foo':
				console.log( 'SERVICE > foo 跑了',  )
				cb({
					type: 'bbb'
				})

				break

			//
			case 'SERVICE.LOAD.ITEMS':
				const fakeItem = () => {
					const id = randomId()
					const d = {
						id,
						label: `Label_${id}`,
					}
					return d
				}

				// instead of fetching data via API, we fake them here
				const arr = [fakeItem(), fakeItem(), fakeItem()]

				console.log( '\nfetched: ', arr )

				const t = random(300, 2000)
				setTimeout(() => {

					// for test only
					// randomly trigger happy and sorrow path to test both scenarios
					// if((t % 2) == 0 ){
					if(true){
					// if(false){
						// if fetching succeeded
						cb({
							type: 'LOAD_ITEM_SUCCESS',
							data: arr,
						})
					} else {
						// if fetching failed, trigger the sorrow path
						cb({
							type: 'LOAD_ITEM_FAIL',
							data: 'network error',
						})
					}
				}, random(100, 1000))

				break

			case 'SERVICE.DELETE.ITEM':
				const { selectedItemId } = ctx
				const item = getItemById(ctx.items, selectedItemId)

				new Promise((resolve, reject) => {
					setTimeout(() => {

						// happy path
						resolve({
							info: `${selectedItemId} deleted succesfully from the server`,
						})

						// sorrow path
						// reject({
						// 	info: `Delete ${selectedItemId} from server failed, data restored.`,
						// 	payload: item,
						// })
					}, 1200)
				})
				.then(result => {
					// console.log( '\tconfirmHandler completed: ', result )
					cb({
						type: 'OPTIMISTIC_DELETE_ITEM_SUCCESS',
						result,
					})
				})
				.catch(error => {
					cb({
						type: 'OPTIMISTIC_DELETE_ITEM_FAIL',
						error,
					})
				})

				break

			// create new item
			case 'SERVICE.CREATE.ITEM':
				const localItem = evt.payload

				// async side effect
				return new Promise((resolve, reject) => {

					// simulate id generated from server, to replace the temporary local id
					const serverId = 'server_' + localItem.id.split('tmp_')[1]
					setTimeout(() => {

						// happy path
						resolve({
							info: `${localItem.id} - ${localItem.label} created succesfully on the server`,
							serverItem: { ...localItem, id: serverId },
							localItem,
						})

						// sorrow path
						// reject({
						// 	info: `Create item: ${localItem.id} on server failed, data restored`,
						// 	localItem,
						// })
					}, 1000)
				})
				.then(result => {
					cb({
						type: 'OPTIMISTIC_CREATE_ITEM_SUCCESS',
						result,
					})
				})
				.catch(error => {
					cb({
						type: 'OPTIMISTIC_CREATE_ITEM_FAIL',
						error,
					})
				})

			// edit item
			case 'SERVICE.EDIT.ITEM':

				const { editedItem, oldItem } = evt
				// async side effect
				return new Promise((resolve, reject) => {

					setTimeout(() => {
						// happy path
						// simulating itm returned from server has added props
						editedItem.modifiedDate = new Date()
						resolve({
							info: `${editedItem.id} - ${editedItem.label} edited succesfully on the server`,
							editedItem,
						})

						// sorrow path
						// reject({
						// 	info: `Edit item: ${oldItem.id} on server failed, data restored`,
						// 	oldItem,
						// })
					}, 1000)
				})
				.then(result => {
					cb({
						type: 'OPTIMISTIC_EDIT_ITEM_SUCCESS',
						result,
					})
				})
				.catch(error => {
					cb({
						type: 'OPTIMISTIC_EDIT_ITEM_FAIL',
						error,
					})
				})

			// demo: multiple requests with cancellation
			case 'test':
				const requestId = ++cnt

				console.log('[test request started]', requestId)

				return new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve({
							info: `Request ${requestId} completed`,
						})
						// reject({
						// 	info: `Request ${requestId} failed`,
						// })
					}, 1500)
				})

					.then(result => {
						console.log('cancelled?', cancelled)
						cb({
							type: 'MODAL_DELETE_ITEM_SUCCESS',
							result,
						})
					})

					.catch(error => {
						cb({
							type: 'MODAL_DELETE_ITEM_FAIL',
							error,
						})
					})

			default:
				console.log('unhandled method call=', evt.type)
		}
	})
}

// Callback service, which could dispatch event multiple times to it's parent
/*export const cancelService = (ctx, e) => (cb, onReceive) => {

	let cnt = 0

	onReceive(evt => {

		switch( evt.type ){

			case 'test':

				const requestId = ++cnt
				const signal = evt.signal

				console.log( '[Service test]', requestId, evt )

				new Promise((resolve, reject) => {

					setTimeout(() => {
						resolve({
							info: `Request ${requestId} completed`,
						})
						// reject({
						// 	info: `Request ${requestId} failed`,
						// })
					}, 1000)
				})

				.then( result => {

					// using DOM api
					// if(signal.aborted === true){

					if(signal.cancel===true){
						console.log( '\n\n[Service cancelled]', requestId)
					}else{
						console.log( '\n\n[Service not cancelled]', requestId )
						cb({
							type: 'testResult',
							result
						})
					}

				})

				.catch( error => {
					return
					cb({
						type: 'testError',
						error
					})
				})

				break

			default:
				console.log( 'Unhandled method call=', evt.type  )
		}
	})

}
*/
