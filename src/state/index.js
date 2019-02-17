import { combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

/*
 * actions
 */

const DELETE_PAPERS = 'DELETE_PAPERS';
const UPDATE_PAPERS = 'UPDATE_PAPERS';
const UPDATE_EDGES = 'UPDATE_EDGES';
const OPEN_MODAL = 'OPEN_MODAL';
const CLOSE_MODAL = 'CLOSE_MODAL';
const SELECT_PAPER = 'SELECT_PAPER';
const SWITCH_LIST_VIEW = 'SWITCH_LIST_VIEW';
const REQUEST_SENT = 'REQUEST_SENT';

/*
 * action creators
 */

export function closeModal() {
  return { type: CLOSE_MODAL };
}
export function openModal(modal) {
  return { type: OPEN_MODAL, modal };
}
export function updatePapers(papers, seeds) {
  return { type: UPDATE_PAPERS, papers, seeds };
}
export function deletePapers(index) {
  return { type: DELETE_PAPERS, index };
}
export function updateEdges(index) {
  return { type: UPDATE_EDGES, index };
}
export function selectPaper(paper) {
  return { type: SELECT_PAPER, paper };
}
export function switchToList(view) {
  return { type: SWITCH_LIST_VIEW, view };
}
export function requestSent(papers, source) {
  return { type: REQUEST_SENT, papers, source };
}

/*
 * reducers
 */

function selectedPapers(state = [], action) {
  switch (action.type) {
    case SELECT_PAPER:
      return [action.paper];
    default:
      return state;
  }
}

function listView(state = 'Seeds', action) {
  if (action.type === SWITCH_LIST_VIEW) {
    return action.view;
  } else {
    return state;
  }
}

function modal(state = 'onboarding', action) {
  switch (action.type) {
    case OPEN_MODAL:
      return action.modal;
    case CLOSE_MODAL:
      return null;
    default:
      return state;
  }
}

function data(state = { Papers: {}, Edges: [] }, action) {
  let Papers = { ...state.Papers };
  let Edges = [...state.Edges];
  switch (action.type) {
    case REQUEST_SENT:
      action.papers.forEach(paper => {
        paper[action.source] = true;
        Papers[paper.ID] = paper;
        return paper;
      });
      return { Papers: Papers, Edges: state.Edges };
    case UPDATE_PAPERS:
      action.papers.forEach(paper => {
        paper.seed = paper.seed || action.seeds;
        paper = addPaper(paper, Papers);
        // For each reference / citedBy match and merge then match / merge edges
        if (paper.seed) {
          // Add references and citations.
          if (paper.references) {
            paper.references.forEach(ref => {
              ref = addPaper(ref, Papers);
              let edge = { source: paper.ID, target: ref.ID };
              addEdge(edge, Edges);
            });
            Papers = updateMetrics(Papers, Edges);
          }
          if (paper.citations) {
            paper.citations.forEach(ref => {
              ref = addPaper(ref, Papers);
              let edge = { source: ref.ID, target: paper.ID };
              addEdge(edge, Edges);
            });
            Papers = updateMetrics(Papers, Edges);
          }
        }
      });
      return { Papers, Edges };
    case DELETE_PAPERS:
      return state;
    default:
      return state;
  }
}

const reducer = combineReducers({ data, modal, listView, selectedPapers });

export const store = createStore(reducer, composeWithDevTools());

//For a new paper this function tries to find a match in the existing database
function matchPaper(paper, Papers) {
  Papers = Object.values(Papers);
  var match;
  if (paper.microsoftID) {
    match = Papers.filter(function(p) {
      return p.microsoftID === paper.microsoftID;
    })[0];
  }
  if (!match && paper.doi) {
    match = Papers.filter(function(p) {
      return paper.doi.toLowerCase() === (p.doi ? p.doi.toLowerCase() : null);
    })[0];
  }
  if (!match && paper.title && paper.author) {
    match = Papers.filter(function(p) {
      if (p.title) {
        return (
          p.title.toLowerCase() === paper.title.toLowerCase() &&
          paper.author.toLowerCase() === (p.author ? p.author.toLowerCase() : null)
        );
      }
      return null;
    })[0];
  }
  return match;
}

function matchEdge(edge, Edges) {
  return Edges.filter(function(e) {
    return (e.source === edge.source) & (e.target === edge.target);
  })[0];
}

//Given two paper/edge objects that are deemed to be matching, this merges the info in the two.
function merge(oldRecord, newRecord) {
  if (!oldRecord) return newRecord;
  let mergedRecord = { ...oldRecord };
  for (let i in newRecord) {
    mergedRecord[i] = oldRecord[i] || newRecord[i];
  }
  mergedRecord.seed = oldRecord.seed || newRecord.seed; //If either record is marked as a seed make the merged result a seed.
  return mergedRecord;
}

function addPaper(paper, Papers) {
  let match = matchPaper(paper, Papers);
  if (!match) {
    paper.ID = Object.keys(Papers).length;
  } else {
    paper = merge(match, paper);
  }
  Papers[paper.ID] = paper;
  return paper;
}

function addEdge(edge, Edges) {
  let matchedEdge = matchEdge(edge, Edges);
  if (!matchedEdge) {
    Edges.push(edge);
  } else {
    merge(matchedEdge, edge);
  }
}

export var metrics = {
  localCitedBy: function(paper, Papers, Edges) {
    //Count number of times cited in the edges list supplied
    return Edges.filter(e => e.target === paper.ID).length;
  },
  localReferences: function(paper, Papers, Edges) {
    //Count number of times a paper cites another paper (in the edge list provided)
    return Edges.filter(e => e.source === paper.ID).length;
  },
  seedsCitedBy: function(paper, Papers, Edges) {
    //Count number of seed papers that cite the paper.
    return Edges.filter(e => Papers[e.source].seed & (e.target === paper.ID)).length;
  },
  seedsCited: function(paper, Papers, Edges) {
    //Count number of seed papers the paper cites.
    return Edges.filter(e => Papers[e.target].seed & (e.source === paper.ID)).length;
  }
};

//Recalculates all metrics
export function updateMetrics(Papers, Edges) {
  let updatedPapers = Papers;
  for (let metric in metrics) {
    for (let p in updatedPapers) {
      let updatedPaper = { ...updatedPapers[p] };
      updatedPaper[metric] = metrics[metric](updatedPaper, Papers, Edges);
      updatedPapers[p] = updatedPaper;
    }
  }
  return updatedPapers;
}
