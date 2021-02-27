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
  const [notes_other, setNotes_other] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);


  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    console.log(notesFromAPI)
    // see the thing is you're going to have to fetch images no matter what
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        console.log(note.image)
        const image = await Storage.get(note.image);
        const skeleton = await Storage.get(note.name)
        note.realID = note.id
        note.image = image;
        note.skeleton = skeleton
      }
      console.log(note)
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
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
                  <h2>{note.name}</h2>
                  <p>{note.description}</p>
                  <button onClick={() => deleteNote(note)}>Delete note</button>
                  {
                    note.image &&
                    <img src={note.image} />
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="Left Side">
          <div style={{ marginBottom: 30 }}>
            {
              notes.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img">
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.image} style={{ height: 300, width: 300 }} />
                        <button class="btn">Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="Right Side">
        
       </div>
        <div label="Other">
          lasdkflaskdf
       </div>
       <div label="Test">
       <div style={{ marginBottom: 30 }}>
         
            {
              notes.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className="floated_img">
                      <b class="cluster">Cluster {note.realID} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} />
                        <img src={note.image} style={{ width: 300 }} />
                        <button class="btn">Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
         </div>
      </Tabs>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);