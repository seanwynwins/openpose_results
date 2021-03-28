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
  function showPicture() {
    var sourceOfPicture = "http://img.tesco.com/Groceries/pi/118/5000175411118/IDShot_90x90.jpg";
    var img = document.getElementById('bigpic')
    img.src = sourceOfPicture.replace('90x90', '225x225');
    img.style.display = "block";
  } 

  let asdf = true

  const [notes, setNotes] = useState([]);
  const [notes_left, setNotes_left] = useState([]);
  const [notes_right, setNotes_right] = useState([]);

  const [notes_NF, setNotes_NF] = useState([]);
  const [notes_left_NF, setNotes_left_NF] = useState([]);
  const [notes_right_NF, setNotes_right_NF] = useState([]);

  const [notes_other, setNotes_other] = useState([]);
  const [notes_3D, setNotes_3D] = useState([]);

  const [notes_selected, setNotes_selected] = useState([]);

  const [formData, setFormData] = useState(initialFormState);

  const [three_ranking, set_three_ranking] = useState("");

  const dict = new Map();
  dict.set("POSE.BOTH", [notes, setNotes]);
  dict.set("POSE.RIGHT", [notes_right, setNotes_right]);
  dict.set("POSE.LEFT", [notes_left, setNotes_left]);
  dict.set("POSE.NOFACE_BOTH", [notes_NF, setNotes_NF]);
  dict.set("POSE.NOFACE_RIGHT", [notes_right_NF, setNotes_right_NF]);
  dict.set("POSE.NOFACE_LEFT", [notes_left_NF, setNotes_left_NF]);
  dict.set("POSE.OTHER", [notes_other, setNotes_other]);
  dict.set("3D", [notes_3D, setNotes_3D]);

  useEffect(() => {
    fetchNotes();
  }, []);

  /**useEffect(() => { 
    setNotes_selected(notes_selected)
  }, [])**/

  //console.log(notes_selected);

  async function updateDDB(note, selected) {
    let note2 = JSON.parse(JSON.stringify(note))

    delete note2.original;

    delete note2.skeleton

    delete note2.image2

    delete note2.percentage

    delete note2.neighbors

    delete note2.count

    delete note2.rotation

    let id = note2.id
    
    // reset note2 id to include count!
    //note2.id = note2.id + " " + note.count

    if (selected) {
      note2.description = "true" + " " + String(note.count)
    } else {
      note2.description = "false" + " " + String(note.count)
    }

    console.log(note2)

    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } } });

    await API.graphql({ query: createNoteMutation, variables: { input: note2 } });
  }

  function updateCount(thisArray, thisID, note, increment, selected) {
    // have to update the "count" field of neighboring notes
    for (let i = 0; i < thisArray.length; i++) {
      let currNeighbor = thisArray[i]
      let name = currNeighbor.id.split(" ")[0]
      let currNeighborID = parseInt(name.slice(name.length - 3))
      if (note.neighbors.includes(currNeighborID) && currNeighborID != thisID) {
        console.log(currNeighborID)
        if (increment) {
          currNeighbor.count = currNeighbor.count + 1
        } else {
          currNeighbor.count = currNeighbor.count - 1
        }
        console.log(currNeighbor.count)
        currNeighbor.description = currNeighbor.description.split(" ")[0] + " " + String(currNeighbor.count)
        console.log(currNeighbor.description)
        updateDDB(currNeighbor, selected)
      }
    }
  }

  function containsID(list, testID) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id == testID) {
        console.log(list[i].id)
        return true;
      }
    }
    return false
  }

  async function fetchNotes() {

    let apiData = await API.graphql({ query: listNotes});

    let nextToken = apiData.data.listNotes.nextToken

    let allNotes = apiData.data.listNotes.items;

    let variables = {
      nextToken,
    }

    let count = 0
    
    while (true) {
      let apiData = await API.graphql({ query: listNotes, variables});

      let notesFromAPI = apiData.data.listNotes.items;

      console.log(allNotes.length)

      let nextToken = apiData.data.listNotes.nextToken
    
      variables = {
        nextToken,
      }

      let testID = notesFromAPI[0]

      console.log(allNotes)

      if (testID == undefined) {
        break
      }
      else {
        allNotes.push.apply(allNotes, notesFromAPI);
      }

      count += 1
      if (count == 1)
        break
    }

    console.log(allNotes)

    const bothNotes = []
    const rightNotes = []
    const leftNotes = []

    const bothNotes_NF = []
    const rightNotes_NF = []
    const leftNotes_NF = []

    const otherNotes = []

    const threeDNotes = []

    const selectedNotes = []

    const ranking = []

    let allRankings = []

    // see the thing is you're going to have to fetch images no matter what
    await Promise.all(allNotes.map(async note => {

      console.log(note.id)

      let noteInfo = note.id.split(" ")

      note.percentage = parseFloat(noteInfo[1])

      note.neighbors = JSON.parse("[" + noteInfo[2] + "]");

      let noteDes = note.description.split(" ")

      note.count = parseInt(noteDes[1])

      console.log(noteInfo[4])

      let selected = "false"

      if (note.description != null) {
        if (note.description.includes("true")) {
          selected = "true"
        }
      }

      if (selected == "false") {
        if (note.image.includes("POSE.BOTH")) {

          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);

          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)

          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2
          bothNotes.push(note)
          return note;
        }
        else if (note.image.includes("POSE.RIGHT")) {
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          const image2 = await Storage.get(image2Name);
          note.image2 = image2
          rightNotes.push(note)
          return note;
        }
        else if (note.image.includes("POSE.LEFT")) {
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2

          leftNotes.push(note)
          return note;
        }
        else if (note.image.includes("POSE.NOFACE_BOTH")) {
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2

          bothNotes_NF.push(note)
          console.log("asdfaskdjfskdjf")
          return note;
        }
        else if (note.image.includes("POSE.NOFACE_RIGHT")) {
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);
          console.log("WHEEEE")
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2

          rightNotes_NF.push(note)
          return note;
        }
        else if (note.image.includes("POSE.NOFACE_LEFT")) {
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2

          leftNotes_NF.push(note)
          return note;
        }
        else if (note.image.includes("POSE.OTHER")){
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);
          console.log(note.image)
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2

          otherNotes.push(note)
          return note;
        } 
        // 3D
        else {
          let n=note.image.lastIndexOf(".jpg");
          let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
          const image2 = await Storage.get(image2Name);
          const image = await Storage.get(note.image);
          const skeleton = await Storage.get(note.name)
          note.original = image;
          note.skeleton = skeleton
          note.image2 = image2
          note.rotation = noteInfo[3]
          threeDNotes.push(note)
          if (!(noteInfo[4] === undefined)) {
            allRankings = noteInfo[4].split(",")
          }
          //set_three_ranking(ranking)
          return note;
        }
      } else {
        let n=note.image.lastIndexOf(".jpg");
        let image2Name = note.image.substring(0,n)+ ".2" +note.image.substring(n);
        const image2 = await Storage.get(image2Name);
        console.log("fuck")
        const image = await Storage.get(note.image);
        const skeleton = await Storage.get(note.name)
        note.original = image;
        note.skeleton = skeleton
        note.image2 = image2
        if (noteInfo[3] === undefined)
          note.rotation = ""
        else
          note.rotation = noteInfo[3]
        selectedNotes.push(note)
        return note;
      }
    }))

    bothNotes.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    rightNotes.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    leftNotes.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    bothNotes_NF.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    rightNotes_NF.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    leftNotes_NF.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    otherNotes.sort((a, b) => (a.percentage < b.percentage) ? 1 : -1)
    selectedNotes.sort((a, b) => {
      if (a.rotation < b.rotation)
        return -1;
      else if (a.rotation > b.rotation)
        return 1;
      else {
        if (a.percentage < b.percentage)
          return 1;
        else
          return -1;
      }
    })
    threeDNotes.sort((a, b) => {
      if (a.rotation < b.rotation)
        return -1;
      else if (a.rotation > b.rotation)
        return 1;
      else {
        if (a.percentage < b.percentage)
          return 1;
        else
          return -1;
      }
    })

    //console.log(allRankings)
    for (let i = 0; i < allRankings.length; i++) {
      let string = "Rotation " + i + " : " + allRankings[i] + " Clusters"
      console.log(string)
      ranking.push(string)
      ranking.push(<br />)
      ranking.push(<br />)
    }

    console.log(threeDNotes)
    setNotes(bothNotes);
    setNotes_right(rightNotes);
    setNotes_left(leftNotes);
    setNotes_NF(bothNotes_NF)
    setNotes_left_NF(leftNotes_NF)
    setNotes_right_NF(rightNotes_NF)
    setNotes_other(otherNotes)
    setNotes_selected(selectedNotes)
    setNotes_3D(threeDNotes)
    set_three_ranking(ranking)
  }

  async function selectImage(note, type) { // param is the argument you passed to the function
    console.log(note)

    updateDDB(note, true)

    let selected = notes_selected

    console.log(note)

    selected.push(note)

    let selectedCopy = [...selected];

    selectedCopy.sort(
      (a, b) => {
        if (a.rotation < b.rotation)
          return -1;
        else if (a.rotation > b.rotation)
          return 1;
        else {
          if (a.percentage < b.percentage)
            return 1;
          else
            return -1;
        }
      }
    )

    let thisIDName = note.id.split(" ")

    let thisID = parseInt(thisIDName[0].slice(thisIDName[0].length - 3))

    updateCount(selectedCopy, thisID, note, true, true)

    setNotes_selected(selectedCopy)

    let list = dict.get(type)[0]

    let updatedList = list.filter(e => e !== note)

    let updatedCopy = [...updatedList];

    console.log(updatedCopy)

    console.log(thisID)

    updateCount(updatedCopy, thisID, note, true, false)

    console.log(type)
    let func = dict.get(type)[1]

    func(updatedCopy)

    // oh also should iterate through selected notes too
  }

  async function deselectImage(note) {
    console.log(note)

    updateDDB(note, false)

    // need to add back into array
    let selected = notes_selected

    let updatedSelected = selected.filter(e => e !== note)

    let selectedCopy = [...updatedSelected]

    let thisIDName = note.id.split(" ")

    let thisID = parseInt(thisIDName[0].slice(thisIDName[0].length - 3))

    updateCount(selectedCopy, thisID, note, false, true)

    setNotes_selected(selectedCopy)

    let string = note["name"]

    console.log(string.split("_skeleton"))

    let type = string.split("_skeleton")[0];

    if (!string.includes("skeleton"))
      type = "3D"

    console.log(type)

    let list = dict.get(type)[0]

    console.log(list)

    list.push(note)

    let updatedCopy = [...list]

    let func = dict.get(type)[1]

    updatedCopy.sort((a, b) => {
      if (a.rotation < b.rotation)
        return -1;
      else if (a.rotation > b.rotation)
        return 1;
      else {
        if (a.percentage < b.percentage)
          return 1;
        else
          return -1;
      }
    })

    updateCount(updatedCopy, thisID, note, false, false)

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
      <h1 >Pose Clustering Results</h1>
      <Tabs>
        <div label="Both Sides">
          <div style={{ marginBottom: 30 }}>
            {
              notes.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className={"floated_img " + ((note.count > 0) ? "red" : "blue")}>
                      <b className="cluster"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div className="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>
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
                    <div className={"floated_img_NOFACE " + ((note.count > 0) ? "red" : "blue")}>
                      <b class="cluster_NOFACE"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>

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
                    <div className={"floated_img " + ((note.count > 0) ? "red" : "blue")}>
                      <b class="cluster"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>

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
                    <div className={"floated_img_NOFACE " + ((note.count > 0) ? "red" : "blue")}>
                      <b class="cluster_NOFACE"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>

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
                    <div className={"floated_img " + ((note.count > 0) ? "red" : "blue")}>
                      <b class="cluster"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>

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
                    <div className={"floated_img_NOFACE " + ((note.count > 0) ? "red" : "blue")}>
                      <b class="cluster_NOFACE"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>

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
                    <div className={"floated_img " + ((note.count > 0) ? "red" : "blue")}>
                      <b class="cluster"> {note.id.split(" ")[0] + " " + note.id.split(" ")[1]} </b>
                      <div class="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>

                        <button class="btn" onClick={() => selectImage(note, "POSE.OTHER")}>Select</button>
                      </div>
                    </div>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div label="3D">
          <div style={{ marginBottom: 30 }}>
            {
              notes_3D.map(note => (
                <div key={note.id || note.name}>
                  {
                    note.image &&
                    <div className={"floated_img_three " + ((note.count > 0) ? "red" : "blue")}>
                      <b className="cluster"> {"Rotation " + note.id.split(" ")[3] + " Cluster " + note.id.split(" ")[0] + ":" + (parseFloat((note.id.split(" ")[1])) * 100).toFixed(2) + '%'} </b>
                      <div className="container">
                        <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                        <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>
                        <button className="btn" onClick={() => selectImage(note, "3D")}>Select</button>
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
                  <div className={"floated_img " + ((note.count > 0) ? "red" : "blue")}>
                  <b class="cluster"> {"Rotation " + note.id.split(" ")[3] + " Cluster " + note.id.split(" ")[0] + ":" + (parseFloat((note.id.split(" ")[1])) * 100).toFixed(2) + '%'} </b>
                    <div class="container">
                      <img src={note.skeleton} style={{ width: 300 }} title={note.neighbors}/>
                      <img src={note.original} style={{ width: 300 }} title={note.neighbors}/>
                      <img src={note.image2} style={{ width: 300 }} title={note.neighbors}/>
                      <button class="btn" onClick={() => deselectImage(note)}>Deselect</button>
                    </div>
                  </div>
                }
              </div>
            ))
          }
        </div>
        <div label="Rotation Rankings">
        <p> {three_ranking}</p>
        </div>
      </Tabs>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);