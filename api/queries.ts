import { gql } from '@apollo/client/core';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      displayName
      email
      avatarUrl
      createdAt
      disabled
      metadata
      emailVerified
    }
  }
`;
export const DELETE_USER = gql`
  mutation DeleteUser($id: uuid = "") {
    deleteUser(id: $id) {
      id
    }
  }
`;
export const GET_CONNECTIONS = gql`
  query GetConnections($project_id: uuid = "") {
    connections(where: { project_id: { _eq: $project_id } }) {
      id
      name
      description
      created_at
    }
  }
`;
export const CREATE_CONNECTION = gql`
  mutation CreateConnection(
    $name: String = ""
    $description: String = ""
    $configuration: json = {}
    $project_id: uuid = ""
  ) {
    insert_connections_one(
      object: {
        configuration: $configuration
        description: $description
        name: $name
        project_id: $project_id
      }
    ) {
      id
    }
  }
`;
export const DELETE_CONNECTION = gql`
  mutation DeleteConnection($id: uuid = "") {
    delete_connections_by_pk(id: $id) {
      id
    }
  }
`;
export const GET_WORKSPACES = gql`
  query GetWorkSpaces($user_id: uuid = "", $project_id: uuid = "") {
    workspaces(
      where: {
        access: { receiver_id: { _eq: $user_id } }
        project_id: { _eq: $project_id }
      }
    ) {
      access {
        id
      }
      id
      created_at
      description
      name
    }
  }
`;
export const GET_WORKSPACE = gql`
  query MyQuery($id: uuid = "") {
    workspaces_by_pk(id: $id) {
      name
      description
    }
  }
`;

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace(
    $receiver_id: uuid = ""
    $sender_id: uuid = ""
    $name: String = ""
    $description: String = ""
    $project_id: uuid = ""
  ) {
    insert_workspaces_one(
      object: {
        access: {
          data: {
            is_accepted: true
            receiver_id: $receiver_id
            sender_id: $sender_id
          }
        }
        description: $description
        name: $name
        project_id: $project_id
      }
    ) {
      id
    }
  }
`;
export const UPDATE_WORKSPACE = gql`
  mutation UpdateProject(
    $id: uuid = ""
    $description: String = ""
    $name: String = ""
  ) {
    update_workspaces_by_pk(
      pk_columns: { id: $id }
      _set: { description: $description, name: $name }
    ) {
      id
    }
  }
`;

export const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: uuid = "") {
    delete_workspaces_by_pk(id: $id) {
      id
    }
  }
`;
export const GET_PROJECTS = gql`
  query GetProjects($userId: uuid = "") {
    projects(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      name
      id
      description
      created_at
    }
  }
`;
export const GET_PROJECT = gql`
  query GetProject($id: uuid = "") {
    projects_by_pk(id: $id) {
      description
      name
      id
    }
  }
`;
export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $description: String = ""
    $name: String = ""
    $user_id: uuid = ""
  ) {
    insert_projects_one(
      object: { description: $description, name: $name, user_id: $user_id }
    ) {
      id
      created_at
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $id: uuid = ""
    $description: String = ""
    $name: String = ""
  ) {
    update_projects_by_pk(
      pk_columns: { id: $id }
      _set: { description: $description, name: $name }
    ) {
      id
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: uuid = "") {
    delete_projects_by_pk(id: $id) {
      id
    }
  }
`;
