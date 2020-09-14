import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

//import { SingleEntryPlugin } from 'webpack';

/* GLobal state of the app
* - search object
* - current recipe object
* - shopping list iobject
* - liked recipes
*/
const state = {};
//window.state = state; //for testing

/* 
* SEARCH CONTROLLER
*/
const controlSearch =  async () => {
    // 1. get  query from the view
    const query = searchView.getInput(); 

  //  const query = 'pizza'; //for testing
  //  console.log(query);


    if(query){
        // 2. create new search object and add it to state
        state.search = new Search(query);

        //3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResCont);

        try {
                    //4. Search for recipes
        await state.search.getResults();

        //5. Render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        } catch (error) {
            alert('Something went wrong');
        }



    }

}
 
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

//FOR TESTING
// window.addEventListener('load', e => {
//     e.preventDefault();
//     controlSearch();
// });


elements.searchResPages.addEventListener('click', e => {

    const btn = e.target.closest('.btn-inline');
    if (btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
     //   console.log(goToPage);
    }


});



/**
 * RECIPE CONTROLLER 
 * */

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if(id) {
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected search item
        if(state.search){
            searchView.highlightSelected(id);
        }

        //create new recipe object
        state.recipe = new Recipe(id);

      //  window.r = state.recipe; //FOR TESTING


        try {
            //get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //render recipe
         //   console.log(state.recipe);
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (error) {
            console.log(error);
            alert('Error processing recipe');
            
        }
        
    }
}


///////////SHOPPING LIST OCNTROLLER ///////////////
const controlList = () =>{
    //create new list if there is none yet
    if(!state.List) state.list = new List();
    
    //add each ingredient to list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.amount, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}


//handle delete and update list item events
elements.list.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

   // handle delete event
   if (e.target.matches('.shopping__delete, .shopping__delete *')){
       
    //delete from state and UI
         state.list.delItem(id);

        listView.deleteItem(id);

    //handle count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value);
        state.list.updateAmount(id, val);
   }
});


/////////////////////LIKE CONTROLLER ///////////////////////

//state.likes = new Likes(); //for testing
//likesView.toggleLikeMenu(state.likes.getNumLikes()); //for testing
 

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();

    const currentID = state.recipe.id;

    //recipe has not yet been liked
    if(!state.likes.isLiked(currentID)){
        //add like to state
        const newLike = state.likes.addLike(
            currentID, 
            state.recipe.title, 
            state.recipe.author, 
            state.recipe.img
        );

        //toggle like button
        likesView.toggleLikeButton(true);

        //add like to UI list
        likesView.renderLike(newLike);
       

    //user has liked current recipe
    } else {

        //remove like from state
        state.likes.deleteLike(currentID);

        //toggle like button
        likesView.toggleLikeButton(false);


        //remove like from UI list
        likesView.deleteLike(currentID);
        

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
}


//restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();

    //toggle likes button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

//handling servings button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        //  decrese servings

        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIng(state.recipe);
        }
    }
    if (e.target.matches('.btn-increase, .btn-increase *')){
        //  increase servings
        state.recipe.updateServings('inc');
        recipeView.updateServingsIng(state.recipe);

    }
     else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
         //add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')){
        //like controller
        controlLike();
    }
 //   console.log(state.recipe);
});



// // window.addEventListener('hashchange', controlRecipe);
// // window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe)); 


