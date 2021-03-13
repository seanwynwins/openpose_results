import React, { useState, useEffect } from 'react';
import './App.css';
import Tabs from "./components/Tabs";
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }


function App() {
  // also have clusterGroups in addition to "notes"?
  // each clusterGroup is probably like 1: ["name1", "name2"]
  // so you iterate through each cluster group, and find name of note or whatever that is in
  // it, and then render it?
  // for each note in cluster group, display this shit
  const [notes, setNotes] = useState([]);
  const [notes_left, setNotes_left] = useState([]);
  const [notes_right, setNotes_right] = useState([]);

  const [notes_NF, setNotes_NF] = useState([]);
  const [notes_left_NF, setNotes_left_NF] = useState([]);
  const [notes_right_NF, setNotes_right_NF] = useState([]);

  const [notes_other, setNotes_other] = useState([]);

  const [notes_selected, setNotes_selected] = useState([]);

  const [formData, setFormData] = useState(initialFormState);

  const dict = new Map();
  dict.set("POSE.BOTH", [notes, setNotes]);
  dict.set("POSE.RIGHT", [notes_right, setNotes_right]);
  dict.set("POSE.LEFT", [notes_left, setNotes_left]);
  dict.set("POSE.NOFACE_BOTH", [notes_NF, setNotes_NF]);
  dict.set("POSE.NOFACE_RIGHT", [notes_right_NF, setNotes_right_NF]);
  dict.set("POSE.NOFACE_LEFT", [notes_left_NF, setNotes_left_NF]);
  dict.set("POSE.OTHER", [notes_other, setNotes_other]);

  useEffect(() => {
    fetchNotes();
  }, []);

  /**useEffect(() => { 
    setNotes_selected(notes_selected)
  }, [])**/

  //console.log(notes_selected);

  async function fetchNotes() {

    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    console.log(notesFromAPI)
    const bothNotes = []
    const rightNotes = []
    const leftNotes = []

    const bothNotes_NF = []
    const rightNotes_NF = []
    const leftNotes_NF = []

    const otherNotes = []

    const selectedNotes = []

    // see the thing is you're going to have to fetch images no matter what
    await Promise.all(notesFromAPI.map(async note => {
      console.log(note.description)

      let selected = "false"

      if (note.description != null) {
        if (note.description == "true") {
          selected = "true"
        }
      }

      if (selected == "false") {
        if (note.image.includes("POSE.BOTH")) {
          console.log(note)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          bothNotes.push(note)
          return note;
        }
        else if (note.image.includes("POSE.RIGHT")) {
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          rightNotes.push(note)
          return note;
        }
        else if (note.image.includes("POSE.LEFT")) {
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          leftNotes.push(note)
          return note;
        }
        else if (note.image.includes("POSE.NOFACE_BOTH")) {
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          bothNotes_NF.push(note)
          console.log("asdfaskdjfskdjf")
          return note;
        }
        else if (note.image.includes("POSE.NOFACE_RIGHT")) {
          console.log("WHEEEE")
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          rightNotes_NF.push(note)
          return note;
        }
        else if (note.image.includes("POSE.NOFACE_LEFT")) {
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          leftNotes_NF.push(note)
          return note;
        }
        else {
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.id = note.id
          note.original = image;
          note.skeleton = skeleton
          otherNotes.push(note)
          return note;
        }
      } else {
        console.log("fuck")
        const image = await Storage.get(note.image);
        const skeleton = await Storage.get(note.name)
        note.id = note.id
        note.original = image;
        note.skeleton = skeleton
        selectedNotes.push(note)
        return note;
      }
    }))

    bothNotes.sort((a, b) => (a.id > b.id) ? 1 : -1)
    rightNotes.sort((a, b) => (a.id > b.id) ? 1 : -1)
    leftNotes.sort((a, b) => (a.id > b.id) ? 1 : -1)
    bothNotes_NF.sort((a, b) => (a.id > b.id) ? 1 : -1)
    leftNotes_NF.sort((a, b) => (a.id > b.id) ? 1 : -1)
    rightNotes_NF.sort((a, b) => (a.id > b.id) ? 1 : -1)
    otherNotes.sort((a, b) => (a.id > b.id) ? 1 : -1)
    selectedNotes.sort((a, b) => (a.id > b.id) ? 1 : -1)

    setNotes(bothNotes);
    setNotes_right(rightNotes);
    setNotes_left(leftNotes);
    setNotes_NF(bothNotes_NF)
    setNotes_left_NF(leftNotes_NF)
    setNotes_right_NF(rightNotes_NF)
    setNotes_other(otherNotes)
    setNotes_selected(selectedNotes)

  }

  async function selectImage(note, type) { // param is the argument you passed to the function
    console.log(note)

    let note2 = JSON.parse(JSON.stringify(note))

    delete note2.original;

    delete note2.skeleton

    let id = note2.id

    note2.description = "true"

    console.log(note2)

    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } } });

    await API.graphql({ query: createNoteMutation, variables: { input: note2 } });

    let selected = notes_selected

    console.log(note)

    selected.push(note)

    let selectedCopy = [...selected];

    selectedCopy.sort((a, b) => (a.id > b.id) ? 1 : -1)

    setNotes_selected(selectedCopy)

    console.log(selectedCopy)

    let list = dict.get(type)[0]

    let updatedList = list.filter(e => e !== note)

    let updatedCopy = [...updatedList];

    let func = dict.get(type)[1]

    func(updatedCopy)
  }

  async function deselectImage(note) {
    console.log(note)

    let note2 = JSON.parse(JSON.stringify(note))

    delete note2.original;

    delete note2.skeleton

    let id = note2.id

    note2.description = "false"

    console.log(note2)

    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } } });

    await API.graphql({ query: createNoteMutation, variables: { input: note2 } });

    // need to add back into array
    let selected = notes_selected

    let updatedSelected = selected.filter(e => e !== note)

    let selectedCopy = [...updatedSelected]

    setNotes_selected(selectedCopy)

    let string = note["name"]

    let type = string.split("_skeleton")[0];

    console.log(type)

    let list = dict.get(type)[0]

    console.log(list)

    list.push(note)

    let updatedCopy = [...list]

    let func = dict.get(type)[1]

    updatedCopy.sort((a, b) => (a.id > b.id) ? 1 : -1)

    func(updatedCopy)
    // store notes here?
    console.log(updatedCopy)
  }

  async function createNote() {
    fetchNotes([]);
    /***if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);***/
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } } });
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <h1 >Pose Clustering Results </h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value })}
        placeholder="Video name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value })}
        placeholder="Video description"
        value={formData.description}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button class="button" onClick={createNote}>Cluster!</button>
      <Tabs>
        <div label="Both Sides">
          <div style={{ marginBottom: 30 }}>
            {
              notes.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img">
                      <b class="cluster">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.BOTH")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
            {
              notes_NF.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img_NOFACE">
                      <b class="cluster_NOFACE">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.NOFACE_BOTH")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="Right Side">
          <div style={{ marginBottom: 30 }}>
            {
              notes_right.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img">
                      <b class="cluster">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.RIGHT")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
            {
              notes_right_NF.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img_NOFACE">
                      <b class="cluster_NOFACE">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.NOFACE_RIGHT")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="Left Side">
          <div style={{ marginBottom: 30 }}>
            {
              notes_left.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img">
                      <b class="cluster">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.LEFT")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
            {
              notes_left_NF.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img_NOFACE">
                      <b class="cluster_NOFACE">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.NOFACE_LEFT")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="Other">
          <div style={{ marginBottom: 30 }}>
            {
              notes_other.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img">
                      <b class="cluster">Cluster {note.id} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.original} style={{ width: 300 }} />
                        <button class="btn" onClick={() => selectImage(note, "POSE.OTHER")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="Selected">
          {
            notes_selected.map(note => (
              <div key={note.id || note.name}>
                {
                  note.image &&
                  <div className="floated_img">
                    <b class="cluster">Cluster {note.id} </b>
                    <div class="container">
                      <img src={note.skeleton} style={{ width: 300 }} />
                      <img src={note.original} style={{ width: 300 }} />
                      <button class="btn" onClick={() => deselectImage(note)}>Deselect</button>
                    </div>
                  </div>
                }
              </div>
            ))
          }
        </div>
      </Tabs>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);