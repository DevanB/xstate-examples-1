/* eslint-disable */
import { randomId, random } from '../utils/helpers'

// A Callback service
// cb() let's up dispatch event to the parent
// onReceive() allows us to receive events from the parent while the service is running
export const itemService = (ctx, e) => (cb, onReceive) => {
	let cnt = 0
	let cancelled = false
	let retries = 0

	onReceive(evt => {
		switch (evt.type) {

			//
			case 'ServiceLoadItems':
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
							type: 'ITEM_LOAD_SUCCESS',
							data: arr,
						})
					} else {
						// if fetching failed, we trigger the sorrow path
						cb({
							type: 'ITEM_LOAD_FAIL',
							data: 'network error',
						})
					}
				}, random(100, 1000))

				break

			case 'ServiceItemDeleteConfirm':
				const item = evt.data

				new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve({
							info: `item: ${item.id} deleted succesfully`,
						})

						// reject({
						// 	info: `item: ${item.id} removal failed`,
						// 	payload: item,
						// })
					}, 1200)
				})
				.then(result => {
					// console.log( '\tconfirmHandler completed: ', result )
					cb({
						type: 'modalDeleteItemSuccess',
						result,
					})
				})
				.catch(error => {
					cb({
						type: 'modalDeleteItemFail',
						error,
					})
				})

				break

			// create new item
			case 'ServiceCreateItems':
				const localItem = evt.payload

				// async side effect
				return new Promise((resolve, reject) => {

					// simulate id generated from server, to replace the temp local id
					const serverId = 'server_' + localItem.id.split('tmp_')[1]
					setTimeout(() => {
						resolve({
							info: `item: ${localItem.id} - ${localItem.label} created succesfully`,
							serverItem: { ...localItem, id: serverId },
							localItem,
						})
						// reject({
						// 	info: `Create item: ${localItem.id} failed`,
						// 	localItem,
						// })
					}, 1000)
				})
				.then(result => {
					cb({
						type: 'NEW_ITEM_SUCCESS',
						result,
					})
				})
				.catch(error => {
					cb({
						type: 'NEW_ITEM_FAIL',
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
