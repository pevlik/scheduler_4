import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore"; 

const firebaseConfig = {
    apiKey: "AIzaSyBFTSbDoVSmJemhoIfBTnfHAI_EKRpAf7s",
    authDomain: "scheduler-db-auth.firebaseapp.com",
    projectId: "scheduler-db-auth",
    storageBucket: "scheduler-db-auth.appspot.com",
    messagingSenderId: "557786043754",
    appId: "1:557786043754:web:981de08bf2f90c46f44113",
    measurementId: "G-HZGSL2DHW0"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const addEvent = async (event) => {
    try {
        const docRef = await addDoc(collection(db, "events"), {
            ...event,
            start: event.start.getTime(),
            end: event.end.getTime()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

export const getEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "events"));
    const events = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
            id: doc.id,
            ...data,
            start: new Date(data.start),
            end: new Date(data.end)
        });
    });
    return events;
};

export const updateEvent = async (id, event) => {
    const eventRef = doc(db, "events", id);
    await updateDoc(eventRef, {
        ...event,
        start: event.start.getTime(),
        end: event.end.getTime()
    });
};

export const deleteEvent = async (id) => {
    await deleteDoc(doc(db, "events", id));
};