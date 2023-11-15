import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AppStyles from "../styles/AppStyles";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  signOut,
  updatePassword,
  signInWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";

export default function ManageAccount({ navigation }) {
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const logout = () => {
    signOut(auth).then(() => {
      navigation.popToTop();
    });
  };

  const updateUserPassword = () => {
    signInWithEmailAndPassword(auth, auth.currentUser.email, currentPassword)
      .then((userCredential) => {
        const user = userCredential.user;
        updatePassword(user, newPassword)
          .then(() => {
            setNewPassword("");
            setErrorMessage("");
            setCurrentPassword("");
          })
          .catch((error) => {
            setErrorMessage(error.message);
          });
      })
      .catch((error) => {
        setErrorMessage(error.message);
      });
  };

  const deleteUserAndToDos = () => {
    if (currentPassword === "") {
      setErrorMessage("Must enter the current password to delete the account");
    } else {
      signInWithEmailAndPassword(auth, auth.currentUser.email, currentPassword)
        .then((userCredential) => {
          const user = userCredential.user;

          const batch = writeBatch(db);
          const q = query(
            collection(db, "todos"),
            where("userId", "==", user.uid)
          );
          getDocs(q).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });
            batch.commit();

            deleteUser(user)
              .then(() => {
                navigation.popToTop();
              })
              .catch((error) => {
                setErrorMessage(error.message);
              });
          });
        })
        .catch((error) => {
          setErrorMessage(error.message);
        });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Current Password"
        value={currentPassword}
        secureTextEntry={true}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.textInput}
        placeholder="New Password"
        value={newPassword}
        secureTextEntry={true}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity style={styles.button} onPress={updateUserPassword}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={deleteUserAndToDos}>
        <Text style={styles.buttonText}>Delete User</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.pop()}>
        <Text style={styles.buttonText}>Back to ToDos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 20,
    fontSize: 16,
  },
  textInput: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#258ea6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
