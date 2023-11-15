import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AppStyles from "../styles/AppStyles";
import { auth, db } from "../firebase";
import AddToDoModal from "../components/AddToDoModal";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { BackHandler, Alert } from "react-native";

const ToDo = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toDos, setToDos] = useState([]);

  useEffect(() => {
    loadToDoList();

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackButtonPress
    );

    return () => backHandler.remove();
  }, []);

  const handleBackButtonPress = () => {
    if (navigation.isFocused()) {
      Alert.alert(
        "Exit App",
        "Are you sure you want to exit the app?",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          { text: "OK", onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: false }
      );
      return true;
    }
    return false;
  };

  const loadToDoList = async () => {
    const q = query(
      collection(db, "todos"),
      where("userId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    let toDos = [];
    querySnapshot.forEach((doc) => {
      let toDo = doc.data();
      toDo.id = doc.id;
      toDos.push({ ...toDo, isEditing: false, editedText: toDo.text });
    });

    setToDos(toDos);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  if (isLoading) {
    loadToDoList();
  }

  const checkToDoItem = async (item, isChecked) => {
    const toDoRef = doc(db, "todos", item.id);
    await setDoc(toDoRef, { completed: isChecked }, { merge: true });
  };

  const deleteToDo = async (toDoId) => {
    await deleteDoc(doc(db, "todos", toDoId));
    let updatedToDos = toDos.filter((item) => item.id !== toDoId);
    setToDos(updatedToDos);
  };

  const startEditing = (item) => {
    const updatedToDos = toDos.map((todo) => {
      if (todo.id === item.id) {
        return { ...todo, isEditing: true };
      } else {
        return { ...todo, isEditing: false };
      }
    });
    setToDos(updatedToDos);
  };

  const updateEditedText = (itemId, text) => {
    const updatedToDos = toDos.map((todo) => {
      if (todo.id === itemId) {
        return { ...todo, editedText: text };
      } else {
        return { ...todo };
      }
    });
    setToDos(updatedToDos);
  };

  const saveEditedToDo = async (itemId) => {
    const editedItem = toDos.find((todo) => todo.id === itemId);

    if (editedItem) {
      const toDoRef = doc(db, "todos", itemId);
      await setDoc(toDoRef, { text: editedItem.editedText }, { merge: true });

      const updatedToDos = toDos.map((todo) => {
        if (todo.id === itemId) {
          return {
            ...todo,
            isEditing: false,
            text: editedItem.editedText,
          };
        } else {
          return { ...todo };
        }
      });

      setToDos(updatedToDos);
    }
  };

  const renderToDoItem = ({ item }) => {
    return (
      <View style={styles.todoItem}>
        <View style={styles.checkboxContainer}>
          {item.isEditing ? (
            <TextInput
              style={styles.editInput}
              value={item.editedText}
              onChangeText={(text) => updateEditedText(item.id, text)}
            />
          ) : (
            <BouncyCheckbox
              isChecked={item.completed}
              size={25}
              fillColor="#258ea6"
              unfillColor="#FFFFFF"
              text={item.text}
              iconStyle={{ borderColor: "#258ea6" }}
              onPress={(isChecked) => {
                checkToDoItem(item, isChecked);
              }}
            />
          )}
        </View>
        <View style={styles.actionsContainer}>
          {item.isEditing ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => saveEditedToDo(item.id)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEditing(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteToDo(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const showToDoList = () => {
    return (
      <FlatList
        data={toDos}
        refreshing={isRefreshing}
        onRefresh={() => {
          loadToDoList();
          setIsRefreshing(true);
        }}
        renderItem={renderToDoItem}
        keyExtractor={(item) => item.id}
      />
    );
  };

  const showContent = () => {
    return (
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#258ea6" />
        ) : (
          showToDoList()
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add ToDo +</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const showSendVerificationEmail = () => {
    return (
      <View style={styles.container}>
        <Text>Please verify your email to use ToDo</Text>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => sendEmailVerification(auth.currentUser)}
        >
          <Text style={styles.verifyButtonText}>Send Verification Email</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const addToDo = async (todo) => {
    let toDoToSave = {
      text: todo,
      completed: false,
      userId: auth.currentUser.uid,
    };
    const docRef = await addDoc(collection(db, "todos"), toDoToSave);

    toDoToSave.id = docRef.id;

    let updatedToDos = [...toDos];
    updatedToDos.push(toDoToSave);

    setToDos(updatedToDos);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>ToDo</Text>
        <TouchableOpacity
          style={styles.manageAccountButton}
          onPress={() => navigation.navigate("ManageAccount")}
        >
          <Text style={styles.manageAccountText}>Manage Account</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <AddToDoModal
          onClose={() => setModalVisible(false)}
          addToDo={addToDo}
        />
      </Modal>
      {auth.currentUser.emailVerified
        ? showContent()
        : showSendVerificationEmail()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#258ea6",
  },
  manageAccountButton: {
    padding: 8,
  },
  manageAccountText: {
    color: "#258ea6",
  },
  todoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    // backgroundColor: "yellow",
    marginTop: 4,
  },
  checkboxContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    backgroundColor: "#258ea6",
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: "#fff",
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#fb4d3d",
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
  },
  saveButton: {
    padding: 8,
    backgroundColor: "#258ea6",
    borderRadius: 8,
    marginRight: 5,
    marginLeft: 5,
  },
  saveButtonText: {
    color: "#fff",
  },
  addButton: {
    alignSelf: "center",
    backgroundColor: "green",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  verifyButton: {
    alignSelf: "center",
    backgroundColor: "#258ea6",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default ToDo;
