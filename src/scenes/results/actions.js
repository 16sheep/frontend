import Parse from "parse";
import history from "./../../main/history";
import queryString from "query-string";

export const results_fetched = results => {
  return {
    type: "RESULTS_FETCHED",
    payload: results
  };
};

export const search_query_updated = search_query => {
  return {
    type: "SEARCH_QUERY_UPDATED",
    payload: search_query
  };
};

export const toggle_tag_from_search_query = (
  current_search_query,
  item_tag
) => {
  return dispatch => {
    let search_params = current_search_query;
    if (current_search_query.tags.length) {
      // if tags present in url
      let selected_tags_array = current_search_query.tags.splice("+");
      let tags_str = "";
      if (selected_tags_array.includes(item_tag)) {
        // if tag already present, remove it
        let new_arr = selected_tags_array.filter(tag => tag !== item_tag);
        selected_tags_array = new_arr;
        tags_str = new_arr.join("+");
      } else {
        // if tag was not present, add it
        selected_tags_array.push(item_tag);
        tags_str = selected_tags_array.join("+");
      }
      search_params.tags = selected_tags_array;
    } else {
      // If No tags yet
      if (item_tag) {
        search_params.tags.push(item_tag);
      }
    }
    dispatch(update_path(search_params));
    // will trigger update_search_query from results_container
  };
};

export const update_path = search_params => {
  return dispatch => {
    const query_params = {
      service_types: !search_params.type.length
        ? undefined
        : search_params.type.join("+"),
      start_date: search_params.start_date || undefined,
      end_date: search_params.end_date || undefined,
      person_nb: search_params.person_nb || undefined,
      //address: this.state.address,
      latitude: search_params.latitude || undefined,
      longitude: search_params.longitude || undefined,
      tags: !search_params.tags.length
        ? undefined
        : search_params.tags.join("+")
    };
    let query_arr = [];
    Object.entries(query_params).forEach(([key, value]) => {
      if(value){
        let to_concat = key + "=" + value;
        query_arr = query_arr.concat(to_concat);
      }
    });
    let query_string = query_arr.join("&");
    history.push("/results?" + query_string);
    // will trigger update_search_query from results_container
  };
};

/* called from componentWillUpdate of results_container */
/* is triggered whenever service_types or tags props have changed */
export const update_search_query = search_params => {
  return dispatch => {
    dispatch(search_query_updated({ search_query: search_params }));
    dispatch(fetch_results(search_params));
  };
};

export const fetch_results = results_search_query => {
  return dispatch => {
    if(results_search_query.speech_query){
      const speech_query_params = results_search_query.speech_query;
      console.log(speech_query_params);
      Parse.Cloud.run("fetch_speech_query", {message:speech_query_params}).then(search_query_object => {
        let search_query = search_query_object.search_query;
        dispatch(update_path(search_query));
        dispatch(search_query_updated({ search_query: search_query }));
      }, error => {
        console.log(error);
      });
    }else{
      Parse.Cloud.run("fetch_results_search_query", {
        search_query: results_search_query
      }).then(results => {
        dispatch(results_fetched(results));
        dispatch(search_query_updated({ search_query: results_search_query }));
      });
    }
  };
};
