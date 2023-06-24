import React, { Component, Fragment } from 'react';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {

    const graphQlQuery = {
      query:`
      {
        user{
          status
        }
      }
      `
    }
    fetch('https://feed-backend-api.onrender.com/graphql',{
    method:'POST',  
    headers:{
        Authorization:'Bearer '+this.props.token,
        'Content-Type': 'application/json'
    },
    body:JSON.stringify(graphQlQuery)

    })
      .then(res => {
        return res.json();
      })
      .then(resData => {

        if(!resData){
          throw new Error('Fetching Status Failed');
        }
        this.setState({ status: resData.data.user.status });
      })
      .catch(this.catchError);

    this.loadPosts();
   
    // socket.on('post',data =>  {
    //   if(data.action === 'create')
    //   {
    //     this.addPost(data.post);
    //   }
    //   else if(data.action === 'update')
    //   {
    //     this.updatedPost(data.post);
    //   }
    //   else if(data.action === 'delete')
    //   {
    //     this.loadPosts();
    //   }
    // })
  }
  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        if (prevState.posts.length >= 2) {
          updatedPosts.pop();
        }
        updatedPosts.unshift(post);
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    });
  }

  updatedPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id);
      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post;
      }
      return {
        posts: updatedPosts
      };
    });
  };

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    const graphqlQurey = {
      query: `
     query FetchPosts($page:Int!){
      posts(page:$page){
        posts {
          _id
          title
          content
          imageUrl
          fileName
          creator {
            name
          }
          createdAt
        }
        totalPost
      }
     }
    `,
    variables:{
      page:page
    }
    };
    fetch('https://feed-backend-api.onrender.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQurey),
    }).then(res => {
      /*  if (res.status !== 200) {
         throw new Error('Failed to fetch posts.');
       } */
      return res.json();
    }).then(resData => {
      console.log(resData);
      if (resData.errrs) {
        throw new Error("Fetching Post failed");
      }

      this.setState({
        posts: resData.data.posts.posts.map(post => {
          console.log(post);
          return {
            ...post,
            imagePath: post.imageUrl,
            fileName: post.fileName
          }
        }),
        totalPosts: resData.data.posts.totalPost,
        postsLoading: false
      });
    }).catch(this.catchError);
    console.log(this.state)
  };

  statusUpdateHandler = event => {
    event.preventDefault();
    const grapQlQuery = {
      query:`
      mutation updateUserStatus($uerStatus : String!){
        updateStatus(status:$uerStatus){
          status
        }
      }
      `,
      variables:{
        uerStatus:this.state.status
      }
    }
    fetch('https://feed-backend-api.onrender.com/graphql',{
      method:'POST',
      headers:{
        Authorization:'Bearer ' + this.props.token,
      'Content-Type':'application/json'
      },
      body:JSON.stringify(grapQlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if(!resData)
        {
          throw new Error("Status Update Failed")
        }
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      console.log(prevState);
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    // Set up data (with image!)
    let formData = new FormData();
    /*  formData.append('title',postData.title);
     formData.append('content',postData.content); */
    formData.append('image', postData.image);
    // console.log(formData.get('image'));
    if (this.state.editPost) {
      console.log(this.state.editPost)
      formData.append('oldPath', this.state.editPost.fileName);
      formData.append('oldUrl', this.state.editPost.imagePath);
      
    }
  
    fetch('https://feed-backend-api.onrender.com/post-image',{
      method:'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token
      },
      body:formData
    }).then(res => {
       return res.json();
    }).then(fetchResData => {
      console.log(fetchResData);
      const fileName = fetchResData.filePath;
      const imageUrl = fetchResData.downloadUrl;
      console.log(fileName);
      console.log(imageUrl);
      let grapQlQuery = {
        query: `
          mutation addNewPost($title:String!,$content:String!,$imageUrl:String!,$fileName:String!){
            createPost(postInput:{title:$title,content:$content,imageUrl:$imageUrl,fileName:$fileName}){
              _id
              title
              content
              imageUrl
              fileName
              creator{
                name
              }
              createdAt
            }
          }
        `,
        variables:{
          title:postData.title,
          content:postData.content,
          imageUrl:imageUrl,
          fileName:fileName
        }
      }

       if (this.state.editPost) {
        console.log(this.state.editPost._id)
        console.log(this.state.editPost)
        grapQlQuery = {
          query: `
          mutation editPost($postId:ID!,$title:String!,$content:String!,$imageUrl:String!,$fileName:String!){
              updatePost(id:$postId,postInput:{title:$title,content:$content,imageUrl:$imageUrl,fileName:$fileName}){
                _id
                title
                content
                imageUrl
                fileName
                creator{
                  name
                }
                createdAt
              }
            }
          
          `,
          variables:{
            postId:this.state.editPost._id,
            title:postData.title,
            content:postData.content,
            imageUrl:imageUrl,
            fileName:fileName

          }
        }
       }

      return fetch('https://feed-backend-api.onrender.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(grapQlQuery)
      })
    })
     .then(res => {
      /* if (res.status !== 200 && res.status !== 201) {
        throw new Error('Creating or editing a post failed!');
      } */
      // console.log(res.json())
      return res.json();
    }).then(resData => {
      console.log(resData);
      if (resData.errors && resData.errors[0] === 422) {
        throw new Error("Invalid Post Input!");
      }
      if (resData.errrs) {
        throw new Error("Post Creation failed");
      }
      let resDataField =  'createPost';
      if(this.state.editPost){
        resDataField = 'updatePost';
      }
     
      const post = {
        id: resData.data[resDataField]._id,
        title: resData.data[resDataField].title,
        content: resData.data[resDataField].content,
        creator: resData.data[resDataField].creator,
        createdAt: resData.data[resDataField].createdAt,
        imagePath: resData.data[resDataField].imageUrl,
        filename: resData.data[resDataField].fileName
      };
      console.log(post);



      this.setState(prevState => {
        console.log(prevState)
        let updatedPosts = [...prevState.posts];
        let updateTotalPost = prevState.totalPost;
        if (prevState.editPost) {
          const postIndex = prevState.posts.findIndex(
            p => p._id === prevState.editPost._id
          );
          updatedPosts[postIndex] = post;
      
        } else {
          updateTotalPost++;
          if (prevState.posts.length >= 2) {
            updatedPosts.pop();
          }
          // updatedPosts.pop();
          updatedPosts.unshift(post);
        }
        return {
          isEditing: false,
          editPost: null,
          editLoading: false,
          totalPosts:updateTotalPost
        };
      });
      this.loadPosts();
    }).catch(err => {
      console.log(err);
      this.setState({
        isEditing: false,
        editPost: null,
        editLoading: false,
        error: err
      });
    });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    console.log(postId)
    const grapQlquery = {
      query:`
        mutation DeletePost($postId:ID!){
          deletePost(id:$postId)
        }
      `,
      variables : {
        postId: postId
      }
    }
    fetch('https://feed-backend-api.onrender.com/graphql',{
    method:'POST',  
    headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify(grapQlquery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if(!resData){
          throw new Error('Deleting post Falied')
        }
        this.loadPosts();
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            // lastPage={Math.ceil(4 / 2)}
            // currentPage={1}
            >
              {this.state.posts.map(post => (
              
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
                 
              ))}
            </Paginator>

          )}

        </section>
      </Fragment>
    );
  }
}

export default Feed;
